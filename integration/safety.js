'use strict';

const fs = require('fs');
const path = require('path');

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1']);
const CI_VARS = ['CI', 'GITHUB_ACTIONS', 'TF_BUILD', 'JENKINS_URL', 'BUILDKITE', 'CODEBUILD_BUILD_ID'];

function assertNotCi(env = process.env) {
	const hit = CI_VARS.find((k) => env[k] && env[k] !== 'false' && env[k] !== '0');
	if (hit) throw new Error(`Refusing to run integration suite in CI (${hit} is set). It is manual-only.`);
}

function assertLoopbackUrl(url) {
	const u = new URL(url);
	if (u.protocol !== 'http:' || !LOOPBACK.has(u.hostname)) {
		throw new Error(`Unsafe target ${u.protocol}//${u.hostname}: only http loopback targets are allowed.`);
	}
	return u;
}

const pidAlive = (pid) => {
	try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
};

/** Exclusive lock file; stale locks (dead pid) are reclaimed. */
function acquireLock(file) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	for (let attempt = 0; attempt < 2; attempt += 1) {
		try {
			fs.writeFileSync(file, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }), { flag: 'wx' });
			return () => { try { fs.unlinkSync(file); } catch (e) { /* already gone */ } };
		} catch (e) {
			if (e.code !== 'EEXIST') throw e;
			let owner = {};
			try { owner = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (x) { /* corrupt */ }
			if (owner.pid && pidAlive(owner.pid)) throw new Error(`Another integration run holds the lock (pid ${owner.pid}).`);
			fs.unlinkSync(file);
		}
	}
	throw new Error('Could not acquire integration lock.');
}

module.exports = { assertNotCi, assertLoopbackUrl, acquireLock, LOOPBACK };
