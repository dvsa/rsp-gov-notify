'use strict';

const fs = require('fs');
const path = require('path');

const STATUSES = ['passed', 'failed', 'skipped', 'not-run', 'dependency-unavailable'];

const esc = (v) => String(v === undefined ? 'undefined' : v)
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Redact anything credential-shaped and bound size. */
function safe(value, max = 600) {
	let s = typeof value === 'string' ? value : JSON.stringify(value, (k, v) => (v === undefined ? '__undefined__' : v));
	if (s === undefined) s = 'undefined';
	s = s
		.replace(/Bearer\s+[\w.-]+/g, 'Bearer <redacted>')
		.replace(/[\w-]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<redacted-key>')
		.replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '<redacted-jwt>');
	return s.length > max ? `${s.slice(0, max)}…[truncated ${s.length - max}]` : s;
}

function summarise(scenarios) {
	const counts = { total: scenarios.length };
	STATUSES.forEach((s) => { counts[s] = scenarios.filter((x) => x.status === s).length; });
	return counts;
}

function renderHtml(r) {
	const rows = r.scenarios.map((s) => `
<details class="sc ${esc(s.status)}"${s.status === 'failed' ? ' open' : ''}>
<summary><b>#${s.number}</b> <span class="badge ${esc(s.status)}">${esc(s.status)}</span> ${esc(s.title)}${s.knownDefect ? ' <span class="badge kd">known-behaviour baseline</span>' : ''} <i>${esc(s.durationMs)} ms</i></summary>
<p><b>Route:</b> ${esc(s.route)} &nbsp; <b>Checks:</b> ${esc(s.description)}</p>
${s.knownDefect ? `<p class="kdnote"><b>Known behaviour:</b> ${esc(s.knownDefect)}</p>` : ''}
${s.reason ? `<p class="reason"><b>Reason:</b> ${esc(s.reason)}</p>` : ''}
${s.failure ? `<pre class="fail">${esc(s.failure)}</pre>` : ''}
<table><tr><th>Step / assertion</th><th>Result</th><th>Expected</th><th>Actual</th></tr>
${s.evidence.map((e) => `<tr class="${e.ok === false ? 'bad' : ''}"><td>${esc(e.label)}</td><td>${e.ok === undefined ? 'action' : e.ok ? 'ok' : 'MISMATCH'}</td><td><code>${esc(e.expected === undefined ? '' : e.expected)}</code></td><td><code>${esc(e.actual === undefined ? '' : e.actual)}</code></td></tr>`).join('')}
</table></details>`).join('\n');

	const byRoute = r.inventory.map((h) => {
		const list = r.scenarios.filter((s) => s.route === `${h.method} /${h.stagePrefix}/${h.route}`);
		return `<tr><td>${esc(h.localFunction)}</td><td>${esc(`${h.method} /${h.stagePrefix}/${h.route}`)}</td><td>${esc(h.authorisation)}</td><td>${esc(h.downstream)}</td><td>${list.length} (${list.filter((s) => s.status === 'passed').length} passed)</td></tr>`;
	}).join('');

	return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>rsp-gov-notify integration report</title>
<style>body{font:14px system-ui,sans-serif;margin:24px;color:#222}table{border-collapse:collapse;margin:6px 0 12px}td,th{border:1px solid #ccc;padding:4px 8px;text-align:left;vertical-align:top}
code,pre{font:12px ui-monospace,monospace;white-space:pre-wrap;word-break:break-all}.badge{padding:1px 7px;border-radius:9px;color:#fff;font-size:12px}.passed{background:#1a7f37}.failed{background:#cf222e}
.skipped,.not-run,.dependency-unavailable{background:#9a6700}.kd{background:#6639ba}.bad{background:#ffebe9}.sc{border:1px solid #ddd;margin:6px 0;padding:6px 10px;border-radius:6px}.fail{background:#ffebe9;padding:6px}
.banner{padding:10px;border-radius:6px;font-weight:bold}.banner.ok{background:#dafbe1}.banner.no{background:#ffebe9}</style></head><body>
<h1>rsp-gov-notify integration report</h1>
<div class="banner ${r.outcome === 'passed' ? 'ok' : 'no'}">Outcome: ${esc(r.outcome)}</div>
<p>Generated ${esc(r.startedAt)} (duration ${esc(r.durationMs)} ms) &middot; Node ${esc(r.runtime.node)} on ${esc(r.runtime.platform)}</p>
<h2>Target and safety gates</h2><ul>${r.safety.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><p>${esc(r.target)}</p>
<h2>Totals</h2><p>Total ${r.counts.total} &middot; passed ${r.counts.passed} &middot; failed ${r.counts.failed} &middot; skipped ${r.counts.skipped} &middot; not-run ${r.counts['not-run']} &middot; dependency-unavailable ${r.counts['dependency-unavailable']}</p>
<p>Handlers: ${r.inventory.length} &middot; HTTP routes: ${r.inventory.filter((h) => h.interface === 'HTTP').length} &middot; Lambda-only functions: ${r.lambdaOnly.length}</p>
<h2>Setup / cleanup stages</h2><table><tr><th>Stage</th><th>Status</th><th>Detail</th></tr>${r.stages.map((s) => `<tr class="${s.ok ? '' : 'bad'}"><td>${esc(s.name)}</td><td>${s.ok ? 'ok' : 'FAILED'}</td><td>${esc(s.detail)}</td></tr>`).join('')}</table>
<h2>Handler / route coverage</h2><table><tr><th>Function</th><th>Route</th><th>Authorisation</th><th>Downstream</th><th>Scenarios</th></tr>${byRoute}</table>
<h2>Scenarios</h2>${rows || '<p>No scenarios executed.</p>'}
<h2>Cleanup</h2><p>${esc(r.cleanup)}</p>
<h2>Remaining coverage limitations</h2><ul>${r.limitations.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
<p><small>Scenario coverage is distinct from source coverage. Skipped / not-run scenarios are not counted as coverage. Downstream Notify behaviour is a local model, not captured from the real service.</small></p>
</body></html>`;
}

function writeReports(dir, report) {
	fs.mkdirSync(dir, { recursive: true });
	const json = path.join(dir, 'report.json');
	const html = path.join(dir, 'report.html');
	fs.writeFileSync(json, JSON.stringify(report, null, 2));
	fs.writeFileSync(html, renderHtml(report));
	const root = path.dirname(dir);
	fs.writeFileSync(path.join(root, 'latest.json'), JSON.stringify(report, null, 2));
	fs.writeFileSync(path.join(root, 'latest.html'), renderHtml(report));
	return { json, html, latest: path.join(root, 'latest.html') };
}

module.exports = {
	esc, safe, summarise, renderHtml, writeReports, STATUSES,
};
