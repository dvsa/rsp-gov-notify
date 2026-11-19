'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const http = require('http');
const path = require('path');

const { writeGenerated } = require('./serverless-config');

const ROOT = path.resolve(__dirname, '..');

function freePort() {
	return new Promise((resolve, reject) => {
		const s = net.createServer();
		s.once('error', reject);
		s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
	});
}

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

/** Run a bounded command, resolving with exit code and tail of output. */
function runBounded(cmd, args, { timeoutMs, env, onLine }) {
	return new Promise((resolve) => {
		const child = spawn(cmd, args, { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
		let tail = '';
		const feed = (d) => { tail = (tail + d.toString()).slice(-4000); if (onLine) onLine(d.toString()); };
		child.stdout.on('data', feed);
		child.stderr.on('data', feed);
		const timer = setTimeout(() => { child.kill('SIGKILL'); resolve({ code: 'timeout', tail }); }, timeoutMs);
		child.on('close', (code) => { clearTimeout(timer); resolve({ code, tail }); });
		child.on('error', (e) => { clearTimeout(timer); resolve({ code: 'spawn-error', tail: e.message }); });
	});
}

/** Starts serverless-offline on loopback with the preload guard. Only this child is ever stopped. */
async function startService({ env, stubPort, log }) {
	const httpPort = await freePort();
	const lambdaPort = await freePort();
	const guard = path.join(__dirname, 'preload-guard.js');
	const childEnv = {
		PATH: process.env.PATH,
		HOME: process.env.HOME,
		TMPDIR: process.env.TMPDIR,
		LANG: process.env.LANG,
		SLS_TELEMETRY_DISABLED: '1',
		SLS_NOTIFICATIONS_MODE: 'off',
		...env,
		INTEGRATION_NOTIFY_STUB_PORT: String(stubPort),
		NODE_OPTIONS: `--require ${guard}`,
	};
	const sls = path.join(ROOT, 'node_modules', '.bin', 'sls');
	const configFile = writeGenerated(env);
	// --useInProcess keeps handlers in the guarded main process (worker threads would not load the preload).
	const child = spawn(sls, ['offline', 'start', '--noAuth', '--useInProcess', '--config', path.basename(configFile), '--host', '127.0.0.1', '--httpPort', String(httpPort), '--lambdaPort', String(lambdaPort), '--stage', 'dev'], {
		cwd: ROOT, env: childEnv, stdio: ['ignore', 'pipe', 'pipe'], detached: true,
	});
	const out = { lines: '', blockedHosts: new Set(), guardActive: false };
	const feed = (d) => {
		const text = d.toString();
		out.lines = (out.lines + text).slice(-6000);
		if (text.includes('INTEGRATION_GUARD_ACTIVE')) out.guardActive = true;
		(text.match(/INTEGRATION_GUARD_BLOCKED host=\S+/g) || []).forEach((m) => out.blockedHosts.add(m.split('=')[1]));
		if (log) log(text);
	};
	child.stdout.on('data', feed);
	child.stderr.on('data', feed);
	let exited = null;
	child.on('exit', (code) => { exited = code === null ? 'signal' : code; });

	const stop = async () => {
		if (exited !== null) return;
		try { process.kill(-child.pid, 'SIGTERM'); } catch (e) { /* gone */ }
		for (let i = 0; i < 30 && exited === null; i += 1) await sleep(100); // eslint-disable-line no-await-in-loop
		if (exited === null) { try { process.kill(-child.pid, 'SIGKILL'); } catch (e) { /* gone */ } }
	};

	return {
		baseUrl: `http://127.0.0.1:${httpPort}`,
		out,
		stop,
		hasExited: () => exited,
		async waitReady(timeoutMs) {
			const deadline = Date.now() + timeoutMs;
			while (Date.now() < deadline) {
				if (exited !== null) throw new Error(`Service exited early with code ${exited}. Output tail: ${out.lines.slice(-800)}`);
				// eslint-disable-next-line no-await-in-loop
				const up = await new Promise((resolve) => {
					const req = http.request({ host: '127.0.0.1', port: httpPort, path: '/', method: 'GET', timeout: 1000 }, (res) => { res.resume(); resolve(true); });
					req.on('error', () => resolve(false));
					req.on('timeout', () => { req.destroy(); resolve(false); });
					req.end();
				});
				if (up) {
					if (!out.guardActive) throw new Error('Network guard did not report active in the service process; refusing to send any request.');
					return;
				}
				await sleep(500); // eslint-disable-line no-await-in-loop
			}
			throw new Error(`Service not ready within ${timeoutMs} ms. Output tail: ${out.lines.slice(-800)}`);
		},
	};
}

function request(baseUrl, { method = 'POST', path: p, body, headers = {}, timeoutMs = 15000 }) {
	const u = new URL(baseUrl);
	return new Promise((resolve, reject) => {
		const data = body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body));
		const req = http.request({
			host: u.hostname, port: u.port, path: p, method, timeout: timeoutMs, headers: { ...(data !== undefined ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } : {}), ...headers },
		}, (res) => {
			const chunks = [];
			res.on('data', (c) => chunks.push(c));
			res.on('end', () => {
				const raw = Buffer.concat(chunks).toString('utf8');
				let json;
				try { json = JSON.parse(raw); } catch (e) { json = undefined; }
				resolve({ status: res.statusCode, headers: res.headers, raw, json });
			});
		});
		req.on('timeout', () => req.destroy(new Error(`HTTP request timed out after ${timeoutMs} ms`)));
		req.on('error', reject);
		if (data !== undefined) req.write(data);
		req.end();
	});
}

module.exports = {
	startService, runBounded, request, sleep, ROOT, fs,
};
