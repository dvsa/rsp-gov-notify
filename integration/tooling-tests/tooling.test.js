'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..', '..');
const f = require('../fixtures');
const inv = require('../inventory');
const { assertNotCi, assertLoopbackUrl, acquireLock } = require('../safety');
const { renderHtml, safe, summarise, writeReports } = require('../report');
const { runScenarios } = require('../scenario-runner');
const { buildScenarios } = require('../scenarios');
const { deriveConfig } = require('../serverless-config');
const { createStub } = require('../notify-stub');

test('inventory matches lambdas.json, serverless.yml routes and source files', () => {
	const lambdas = require(path.join(ROOT, 'lambdas.json')).lambdas;
	assert.deepStrictEqual(inv.handlers.map((h) => h.localFunction).sort(), [...lambdas].sort());
	const yml = fs.readFileSync(path.join(ROOT, 'serverless.yml'), 'utf8');
	inv.handlers.forEach((h) => {
		assert.ok(fs.existsSync(path.join(ROOT, h.file)), h.file);
		assert.ok(/export const handler/.test(fs.readFileSync(path.join(ROOT, h.file), 'utf8')));
		assert.ok(yml.includes(`path: ${h.route}`) && yml.includes(`handler: ${h.lambdaHandler}`));
		assert.ok(yml.includes(`method: ${h.method.toLowerCase()}`));
	});
	const functionsDir = fs.readdirSync(path.join(ROOT, 'src/functions')).filter((n) => n.endsWith('.js'));
	assert.strictEqual(functionsDir.length, inv.handlerCount);
	assert.strictEqual(inv.httpRouteCount, 2);
});

test('every inventoried route has scenarios and every scenario names a route', () => {
	const scenarios = buildScenarios();
	const routes = new Set(inv.handlers.map((h) => `${h.method} /${h.stagePrefix}/${h.route}`));
	routes.forEach((r) => assert.ok(scenarios.filter((s) => s.route === r).length >= 10, r));
	scenarios.forEach((s) => assert.ok(routes.has(s.route) && s.description.length > 20, s.title));
});

test('fixtures are synthetic and cover all languages', () => {
	assert.strictEqual(Object.keys(f.LANGUAGES).length, 24);
	Object.values(f.RECIPIENTS.email).forEach((e) => assert.ok(e.endsWith('@example.com')));
	Object.values(f.RECIPIENTS.sms).forEach((p) => assert.ok(/^07700900\d{3}$/.test(p)));
	assert.ok(f.PORTAL_URL.includes('.invalid'));
	const env = f.serviceEnv();
	assert.strictEqual(env.USE_SECRETS_MANAGER, 'false');
	assert.strictEqual(Object.keys(env).filter((k) => k.startsWith('TEMPLATE_KEY_')).length, 48);
	// env names agree with production config key list (names only, no import)
	const src = fs.readFileSync(path.join(ROOT, 'src/utils/config.js'), 'utf8');
	Object.keys(env).filter((k) => k !== 'USE_SECRETS_MANAGER').forEach((k) => assert.ok(src.includes(`'${k}'`), k));
	assert.ok(src.includes('USE_SECRETS_MANAGER'));
});

test('CI and non-loopback targets are refused', () => {
	assert.throws(() => assertNotCi({ CI: 'true' }), /CI/);
	assert.throws(() => assertNotCi({ GITHUB_ACTIONS: 'true' }), /CI/);
	assert.doesNotThrow(() => assertNotCi({}));
	assert.doesNotThrow(() => assertLoopbackUrl('http://127.0.0.1:3000'));
	assert.doesNotThrow(() => assertLoopbackUrl('http://localhost:3000'));
	['https://127.0.0.1', 'http://example.com', 'http://10.0.0.5:3000', 'http://0.0.0.0:1'].forEach((u) => assert.throws(() => assertLoopbackUrl(u), /Unsafe/));
});

test('lock is exclusive and stale locks are reclaimed', () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-'));
	const file = path.join(dir, '.lock');
	const release = acquireLock(file);
	assert.throws(() => acquireLock(file), /holds the lock/);
	release();
	fs.writeFileSync(file, JSON.stringify({ pid: 2 ** 22 + 12345 }));
	const r2 = acquireLock(file);
	r2();
	assert.ok(!fs.existsSync(file));
});

test('generated config drops dotenv plugin and injects env; fails on layout drift', () => {
	const src = fs.readFileSync(path.join(ROOT, 'serverless.yml'), 'utf8');
	const out = deriveConfig(src, { NOTIFY_API_KEY: 'x"y' });
	assert.ok(!out.includes('serverless-dotenv-plugin'));
	assert.ok(out.includes('    NOTIFY_API_KEY: "x\\"y"'));
	assert.ok(out.includes('serverless-offline'));
	assert.throws(() => deriveConfig('plugins:\n  - a\n', {}), /dotenv/);
	assert.throws(() => deriveConfig('  - serverless-dotenv-plugin\n', {}), /region/);
});

test('report redacts credentials and escapes HTML; every status counted', () => {
	assert.ok(!safe(`Bearer abc.def.ghi ${f.serviceEnv().NOTIFY_API_KEY}`).includes('abc.def'));
	assert.ok(!safe(f.serviceEnv().NOTIFY_API_KEY).includes('00000000-0000'));
	const scen = ['passed', 'failed', 'skipped', 'not-run', 'dependency-unavailable'].map((status, i) => ({
		number: i + 1, route: 'POST /dev/notifyEmail', title: '<script>alert(1)</script>', description: 'd', status, durationMs: 1, evidence: [{ label: '<b>', ok: false, expected: '<i>', actual: '&' }], failure: '<img src=x onerror=1>', knownDefect: '<k>',
	}));
	const counts = summarise(scen);
	assert.deepStrictEqual([counts.passed, counts.failed, counts.skipped, counts['not-run'], counts['dependency-unavailable']], [1, 1, 1, 1, 1]);
	const html = renderHtml({
		outcome: 'failed', startedAt: 'x', durationMs: 1, runtime: { node: 'v', platform: 'p' }, target: '<t>', safety: [], inventory: inv.handlers, lambdaOnly: [], counts, stages: [{ name: 'n', ok: false, detail: '<d>' }], scenarios: scen, cleanup: 'c', limitations: ['l'],
	});
	assert.ok(!html.includes('<script>') && !html.includes('<img'));
	assert.ok(!/(src|href)=["']https?:/.test(html), 'no external assets');
});

test('reports are written even when nothing ran', () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rep-'));
	const files = writeReports(path.join(dir, 'run1'), {
		outcome: 'failed', startedAt: 'x', durationMs: 1, runtime: { node: 'v', platform: 'p' }, target: 't', safety: [], inventory: inv.handlers, lambdaOnly: [], counts: summarise([]), stages: [{ name: 'Setup', ok: false, detail: 'boom' }], scenarios: [], cleanup: 'c', limitations: [],
	});
	assert.ok(fs.existsSync(files.html) && fs.existsSync(files.json) && fs.existsSync(files.latest));
});

test('scenario runner derives statuses from execution only', async () => {
	const scs = [
		{ route: 'r', title: 'ok', description: 'd', run: async (c) => c.eq('a', 1, 1) },
		{ route: 'r', title: 'bad', description: 'd', run: async (c) => c.eq('a', 1, 2) },
		{ route: 'r', title: 'throws', description: 'd', run: async () => { throw new Error('boom'); } },
		{ route: 'r', title: 'slow', description: 'd', run: () => new Promise(() => {}) },
	];
	const { results, counts } = await runScenarios(scs, { makeCtx: () => ({}), timeoutMs: 100 });
	assert.deepStrictEqual(results.map((r) => r.status), ['passed', 'failed', 'failed', 'failed']);
	assert.strictEqual(counts.passed, 1);
	assert.ok(results[3].failure.includes('timed out'));
	assert.strictEqual(results[1].evidence[0].ok, false);
	const skipped = await runScenarios(scs, { makeCtx: () => ({}), skipAll: { status: 'not-run', reason: 'setup' } });
	assert.strictEqual(skipped.counts['not-run'], 4);
});

test('notify stub is deterministic and never retains credentials', async () => {
	const stub = createStub(f.stubTriggers());
	const port = await stub.start();
	const post = (body, auth) => new Promise((resolve) => {
		const req = http.request({ port, host: '127.0.0.1', method: 'POST', path: '/v2/notifications/email', headers: { authorization: auth, 'content-type': 'application/json' } }, (res) => {
			let d = ''; res.on('data', (c) => { d += c; }); res.on('end', () => resolve({ status: res.statusCode, body: d }));
		});
		req.end(JSON.stringify(body));
	});
	const jwt = 'Bearer aaa.bbb.ccc';
	assert.strictEqual((await post({ template_id: 't', email_address: f.RECIPIENTS.email.ok }, jwt)).status, 201);
	assert.strictEqual((await post({ template_id: 't', email_address: f.RECIPIENTS.email[429] }, jwt)).status, 429);
	assert.strictEqual((await post({ email_address: 'x' }, jwt)).status, 400);
	assert.ok(!JSON.stringify(stub.received).includes('aaa.bbb'));
	assert.strictEqual(stub.received[0].authShape, 'Bearer <jwt>');
	await stub.stop();
});

test('unit/coverage discovery excludes integration files', () => {
	const pkg = require(path.join(ROOT, 'package.json'));
	assert.ok(pkg.scripts.test.includes('src/**/*.unit.js'));
	assert.ok(!pkg.scripts.test.includes('integration'));
	assert.ok(!/integration/.test(fs.readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8')));
	assert.ok(fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8').includes('integration-reports'));
});
