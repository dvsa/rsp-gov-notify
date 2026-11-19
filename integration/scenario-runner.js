'use strict';

const assert = require('assert');
const { safe, summarise } = require('./report');

/** Executes scenarios sequentially; statuses derive only from actual execution. */
async function runScenarios(scenarios, { makeCtx, onStart, onEnd, timeoutMs = 30000, skipAll }) {
	const results = [];
	for (let i = 0; i < scenarios.length; i += 1) {
		const sc = scenarios[i];
		const number = i + 1;
		const res = {
			number, route: sc.route, title: sc.title, description: sc.description, knownDefect: sc.knownDefect || null, status: 'not-run', evidence: [], durationMs: 0,
		};
		if (onStart) onStart(number, scenarios.length, sc);
		if (skipAll) {
			res.status = skipAll.status;
			res.reason = skipAll.reason;
		} else {
			const t0 = Date.now();
			const evidence = res.evidence;
			const ctx = makeCtx(evidence);
			ctx.eq = (label, actual, expected) => {
				let ok = true;
				try { assert.deepStrictEqual(actual, expected); } catch (e) { ok = false; }
				evidence.push({ label, ok, expected: safe(expected), actual: safe(actual) });
				if (!ok) throw new assert.AssertionError({ message: `${label}: expected ${safe(expected, 200)} but got ${safe(actual, 200)}`, actual, expected });
			};
			let timer;
			try {
				await Promise.race([
					sc.run(ctx),
					new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`Scenario timed out after ${timeoutMs} ms`)), timeoutMs); }),
				]);
				res.status = 'passed';
			} catch (e) {
				res.status = 'failed';
				res.failure = safe(e && e.message ? e.message : String(e), 1200);
			} finally {
				clearTimeout(timer);
				res.durationMs = Date.now() - t0;
			}
		}
		results.push(res);
		if (onEnd) onEnd(res);
	}
	return { results, counts: summarise(results) };
}

module.exports = { runScenarios };
