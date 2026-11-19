#!/usr/bin/env node
'use strict';

/*
 * Manual black-box integration run for rsp-gov-notify.
 *   - starts its OWN serverless-offline on random loopback ports (never touches an existing service)
 *   - points all Notify traffic at a local stub; real GOV.UK Notify sends are not possible
 *   - writes HTML + JSON reports even when setup fails
 */
const path = require('path');
const fs = require('fs');
const { handlers, lambdaOnly, unverified } = require('./inventory');
const f = require('./fixtures');
const { createStub } = require('./notify-stub');
const {
	startService, runBounded, request, ROOT,
} = require('./service');
const { assertNotCi, assertLoopbackUrl, acquireLock } = require('./safety');
const { writeReports, summarise, safe } = require('./report');
const { buildScenarios } = require('./scenarios');
const { runScenarios } = require('./scenario-runner');
const { GENERATED } = require('./serverless-config');

const say = (m) => process.stdout.write(`${m}\n`);

async function main() {
	const startedAt = new Date();
	const stamp = startedAt.toISOString().replace(/[:.]/g, '-');
	const reportsRoot = path.join(ROOT, 'integration-reports');
	const stages = [];
	const stage = (name, ok, detail) => { stages.push({ name, ok, detail: safe(detail, 800) }); say(`[${ok ? 'ok' : 'FAIL'}] ${name}${detail ? ` - ${safe(detail, 200)}` : ''}`); };
	const scenarios = buildScenarios();
	let counts;
	let results = [];
	let target = 'No target started.';
	let cleanup = 'Nothing to clean up.';
	let setupError = null;
	let release = null;
	let stub = null;
	let service = null;

	say(`rsp-gov-notify integration suite - ${scenarios.length} scenarios, ${handlers.length} handlers / ${handlers.length} HTTP routes`);
	try {
		assertNotCi();
		stage('CI refusal check', true, 'not running in CI');
		release = acquireLock(path.join(reportsRoot, '.lock'));
		stage('Run lock acquired', true, 'integration-reports/.lock');

		say('Building bundles (webpack, local only)...');
		const build = await runBounded(path.join(ROOT, 'node_modules/.bin/webpack-cli'), ['--config', 'webpack.config.js'], {
			timeoutMs: 180000, env: { PATH: process.env.PATH, HOME: process.env.HOME },
		});
		if (build.code !== 0) throw new Error(`Build failed (${build.code}): ${build.tail.slice(-400)}`);
		stage('Build .webpack bundles', true, 'webpack compiled');

		stub = createStub(f.stubTriggers());
		const stubPort = await stub.start();
		stage('Notify stub started', true, `127.0.0.1:${stubPort}`);

		say('Starting local serverless-offline (loopback, --noAuth, network guard)...');
		service = await startService({ env: f.serviceEnv(), stubPort });
		await service.waitReady(120000);
		assertLoopbackUrl(service.baseUrl);
		target = `Service ${service.baseUrl} (own process, loopback). Notify -> local stub 127.0.0.1:${stubPort}. Private .env not loaded (generated config drops serverless-dotenv-plugin); config is synthetic.`;
		stage('Service ready + network guard active', true, service.baseUrl);

		const probe = await request(service.baseUrl, { method: 'GET', path: '/dev/notifyEmail', timeoutMs: 10000 });
		if (probe.status !== 404) throw new Error(`Preflight route probe unexpected status ${probe.status}`);
		stage('Preflight route probe', true, 'emulator answers; GET not routed');

		const outcome = await runScenarios(scenarios, {
			makeCtx: () => {
				stub.reset();
				return {
					stub,
					request: (o) => request(service.baseUrl, o),
					post: (kind, body, o = {}) => request(service.baseUrl, { method: 'POST', path: kind === 'email' ? '/dev/notifyEmail' : '/dev/notifySms', body, ...o }),
				};
			},
			onStart: (n, total, sc) => say(`(${n}/${total}) START ${sc.title}`),
			onEnd: (r) => say(`(${r.number}/${scenarios.length}) ${r.status.toUpperCase()} ${r.durationMs}ms${r.failure ? ` - ${r.failure.slice(0, 200)}` : ''}`),
		});
		results = outcome.results;
		if (service.out.blockedHosts.size) stage('Network guard', true, `blocked outbound hosts: ${[...service.out.blockedHosts].join(', ')}`);
	} catch (e) {
		setupError = e;
		stage('Setup/run', false, e.message);
	} finally {
		const notes = [];
		if (service) { try { await service.stop(); notes.push('Service process (started by this run) stopped.'); } catch (e) { notes.push(`Service stop problem: ${e.message}`); } }
		if (stub) { try { await stub.stop(); notes.push('Notify stub stopped.'); } catch (e) { notes.push('Stub stop problem.'); } }
		if (release) { try { fs.unlinkSync(path.join(ROOT, GENERATED)); notes.push('Generated serverless config removed.'); } catch (e) { /* none */ } }
		if (release) { release(); notes.push('Lock released.'); }
		notes.push('No databases or shared resources are written; no fixtures persist.');
		cleanup = notes.join(' ');
		stage('Cleanup', true, cleanup);
	}

	if (!results.length) {
		const { results: r } = await runScenarios(scenarios, { makeCtx: () => ({}), skipAll: { status: 'not-run', reason: `Setup failed: ${setupError ? safe(setupError.message, 300) : 'unknown'}` } });
		results = r;
	}
	counts = summarise(results);
	const failed = counts.failed > 0 || setupError;
	const report = {
		outcome: failed ? 'failed' : (counts.passed === counts.total ? 'passed' : 'incomplete'),
		startedAt: startedAt.toISOString(),
		durationMs: Date.now() - startedAt.getTime(),
		runtime: { node: process.version, platform: `${process.platform}/${process.arch}` },
		target,
		safety: [
			'Loopback-only target; CI execution refused',
			'Real GOV.UK Notify sends are impossible: Notify host redirected to local stub, every other outbound host blocked',
			'Private .env and AWS credentials are not loaded or passed to the service',
			'No persistence layer: no seed/restore needed',
			'Own service process on random ports; any existing service is untouched',
		],
		inventory: handlers,
		lambdaOnly,
		counts,
		stages,
		scenarios: results,
		cleanup,
		limitations: unverified.concat(['Notify success/error bodies are modelled by the stub, not captured from the real service', 'Per-scenario assertions on logs are not made']),
	};
	const files = writeReports(path.join(reportsRoot, stamp), report);
	say(`\nTotals: ${counts.total} scenarios - passed ${counts.passed}, failed ${counts.failed}, skipped ${counts.skipped}, not-run ${counts['not-run']}, dependency-unavailable ${counts['dependency-unavailable']}`);
	say(`Outcome: ${report.outcome}`);
	say(`HTML report: ${files.html}`);
	say(`Latest:      ${files.latest}  (open with: npm run test-i:report)`);
	process.exitCode = report.outcome === 'passed' ? 0 : 1;
}

if (require.main === module) {
	main().catch((e) => { process.stderr.write(`Fatal: ${e.stack}\n`); process.exitCode = 2; });
}

module.exports = { main };
