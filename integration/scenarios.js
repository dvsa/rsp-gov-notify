'use strict';

const f = require('./fixtures');
const { STAGE } = require('./inventory');

const KINDS = {
	email: { route: `POST /${STAGE}/notifyEmail`, path: `/${STAGE}/notifyEmail`, fn: 'notifyEmail', label: 'Email' },
	sms: { route: `POST /${STAGE}/notifySms`, path: `/${STAGE}/notifySms`, fn: 'notifySms', label: 'SMS' },
};

const SUCCESS_MSG = { message: 'Notification successfully sent to GOV.UK' };

/**
 * Each scenario: { kind, title, description, knownDefect?, run(ctx) }.
 * ctx: post(kind, body, opts) -> response; stub; eq(label, actual, expected); note(label, value)
 */
function buildScenarios() {
	const list = [];
	const add = (kind, title, description, run, knownDefect) => list.push({
		kind, route: KINDS[kind].route, title: `${KINDS[kind].label}: ${title}`, description, run, knownDefect,
	});

	Object.keys(KINDS).forEach((kind) => {
		const recipientKey = kind === 'email' ? 'email_address' : 'phone_number';

		add(kind, 'valid request sends exactly one correctly shaped Notify request', 'Response 200 + success message; Notify received 1 POST with expected template, recipient and personalisation; auth header is a Bearer JWT; no credential in response.', async (c) => {
			const payload = f.payloadFor(kind);
			const r = await c.post(kind, payload);
			c.eq('HTTP status', r.status, 200);
			c.eq('content-type', r.headers['content-type'], 'application/json; charset=utf-8');
			c.eq('response body', r.json, SUCCESS_MSG);
			c.eq('Notify request count (read-back from stub)', c.stub.received.length, 1);
			const q = c.stub.received[0];
			c.eq('Notify method + path', `${q.method} ${q.path}`, `POST ${f.notifyPath(kind)}`);
			c.eq('Notify auth header shape', q.authShape, 'Bearer <jwt>');
			c.eq('Notify request body', q.body, f.expectedNotifyBody(kind, payload));
		});

		add(kind, 'English hyperlink has no language parameter; non-English adds ?clang=', 'For en the link is <portal>/<token>; for cy/fr/ua it ends with ?clang=<lang>. Verified on the request received by Notify.', async (c) => {
			for (const lang of ['en', 'cy', 'fr', 'ua']) {
				c.stub.reset();
				const payload = f.payloadFor(kind, { Language: lang });
				const r = await c.post(kind, payload); // eslint-disable-line no-await-in-loop
				c.eq(`[${lang}] status`, r.status, 200);
				c.eq(`[${lang}] Hyperlink`, c.stub.received[0].body.personalisation.Hyperlink, `${f.PORTAL_URL}/${payload.Token}${lang === 'en' ? '' : `?clang=${lang}`}`);
			}
		});

		add(kind, 'every supported language selects its own template key', 'All 24 language codes: 200 and the matching template_id reaches Notify.', async (c) => {
			for (const lang of Object.keys(f.LANGUAGES)) {
				c.stub.reset();
				const r = await c.post(kind, f.payloadFor(kind, { Language: lang })); // eslint-disable-line no-await-in-loop
				c.eq(`[${lang}] status`, r.status, 200);
				c.eq(`[${lang}] template_id`, c.stub.received.map((q) => q.body.template_id), [f.templateKey(kind, lang)]);
			}
		});

		add(kind, 'unicode/special characters and extra fields are handled exactly', 'Location with accents/symbols forwarded unchanged; unknown extra fields are not forwarded to Notify.', async (c) => {
			const payload = f.payloadFor(kind, { Location: 'Caerdydd – Ffordd y Bae & "Quay" <5>', Extra: 'must-not-forward', Amount: 12345 });
			const r = await c.post(kind, payload);
			c.eq('status', r.status, 200);
			const sent = c.stub.received[0].body;
			c.eq('personalisation.Location', sent.personalisation.Location, payload.Location);
			c.eq('personalisation.Amount', sent.personalisation.Amount, 12345);
			c.eq('Notify body (no Extra field)', sent, f.expectedNotifyBody(kind, payload));
		});

		[[400, 'rejection'], [403, 'authentication failure'], [500, 'server error']].forEach(([code, label]) => {
			add(kind, `Notify ${label} (${code}) is returned as 400 with statusCode and errors`, `Stub-modelled Notify ${code}: service responds 400 whose body carries statusCode ${code} and the Notify errors array.`, async (c) => {
				const r = await c.post(kind, f.payloadFor(kind, {}, String(code)));
				c.eq('status', r.status, 400);
				c.eq('body', r.json, { statusCode: code, errors: [{ error: { 400: 'BadRequestError', 403: 'AuthError', 500: 'Exception' }[code], message: { 400: 'Stub: recipient rejected', 403: 'Stub: invalid token', 500: 'Stub: internal error' }[code] }] });
				c.eq('Notify request count', c.stub.received.length, 1);
			});
		});

		add(kind, 'Notify rate limit (429) is surfaced as HTTP 400, not 429', 'OpenAPI documents 429 for this route but the service maps every Notify failure to 400. Body keeps statusCode 429.', async (c) => {
			const r = await c.post(kind, f.payloadFor(kind, {}, '429'));
			c.eq('status (documented 429, actual 400)', r.status, 400);
			c.eq('body', r.json, { statusCode: 429, errors: [{ error: 'RateLimitError', message: 'Stub: rate limit exceeded' }] });
		}, 'serverless.yml documents a 429 response, but the handler returns 400 for rate limiting. Baseline asserts the current 400.');

		add(kind, 'network failure to Notify returns 400 RSPError without statusCode', 'Stub drops the connection; response body has no statusCode and one RSPError whose message starts with "An unexpected error occurred."', async (c) => {
			const r = await c.post(kind, f.payloadFor(kind, {}, 'drop'));
			c.eq('status', r.status, 400);
			c.eq('has statusCode', Object.prototype.hasOwnProperty.call(r.json, 'statusCode'), false);
			c.eq('errors[0].error', r.json.errors[0].error, 'RSPError');
			c.eq('message prefix', r.json.errors[0].message.startsWith('An unexpected error occurred.'), true);
			c.eq('errors length', r.json.errors.length, 1);
		});

		add(kind, 'missing Language sends no template and a "?clang=undefined" link', 'Language is required by the OpenAPI model but not validated. Notify receives no template_id (JSON drops undefined) and the link contains clang=undefined; the stub rejects it, so the client sees 400.', async (c) => {
			const payload = f.payloadFor(kind);
			delete payload.Language;
			const r = await c.post(kind, payload);
			c.eq('status', r.status, 400);
			c.eq('body', r.json, { statusCode: 400, errors: [{ error: 'ValidationError', message: 'Stub: template_id is required' }] });
			const q = c.stub.received[0].body;
			c.eq('template_id forwarded', Object.prototype.hasOwnProperty.call(q, 'template_id'), false);
			c.eq('Hyperlink', q.personalisation.Hyperlink, `${f.PORTAL_URL}/${payload.Token}?clang=undefined`);
		}, 'Missing/unsupported Language is not validated by the service; it still calls Notify with an undefined template and "?clang=undefined" link.');

		add(kind, 'unsupported Language code forwards no template_id', 'Language "xx": Notify receives no template_id; stub-modelled rejection is relayed as 400.', async (c) => {
			const r = await c.post(kind, f.payloadFor(kind, { Language: 'xx' }));
			c.eq('status', r.status, 400);
			c.eq('Notify request count', c.stub.received.length, 1);
			c.eq('template_id forwarded', Object.prototype.hasOwnProperty.call(c.stub.received[0].body, 'template_id'), false);
			c.eq('Hyperlink', c.stub.received[0].body.personalisation.Hyperlink, `${f.PORTAL_URL}/int0123456789abcdef?clang=xx`);
		}, 'Unsupported languages are not validated by the service.');

		add(kind, 'missing recipient is forwarded without a recipient field', `No ${kind === 'email' ? 'Email' : 'PhoneNumber'}: service still calls Notify (no ${recipientKey}); stub-modelled rejection relayed as 400.`, async (c) => {
			const payload = f.payloadFor(kind);
			delete payload[kind === 'email' ? 'Email' : 'PhoneNumber'];
			const r = await c.post(kind, payload);
			c.eq('status', r.status, 400);
			c.eq('Notify request count', c.stub.received.length, 1);
			c.eq(`${recipientKey} forwarded`, Object.prototype.hasOwnProperty.call(c.stub.received[0].body, recipientKey), false);
		}, 'Required recipient is not validated locally by the service.');

		add(kind, 'missing request body: handler throws, nothing sent to Notify', 'No body: serverless-offline returns 502 with empty body; Notify receives no request.', async (c) => {
			const r = await c.post(kind, undefined);
			c.eq('status', r.status, 502);
			c.eq('raw body', r.raw, '');
			c.eq('Notify request count', c.stub.received.length, 0);
		}, 'Invalid input surfaces as an unhandled error (502 under serverless-offline) rather than a 4xx. Deployed API Gateway mapping is not verified.');

		add(kind, 'malformed JSON body: handler throws, nothing sent to Notify', 'Body "{nope": 502 with empty body; Notify receives no request.', async (c) => {
			const r = await c.post(kind, '{nope');
			c.eq('status', r.status, 502);
			c.eq('Notify request count', c.stub.received.length, 0);
		}, 'Same unhandled-error behaviour as a missing body.');

		add(kind, 'JSON "null" body is rejected like a missing body', 'Body "null": 502, nothing sent.', async (c) => {
			const r = await c.post(kind, 'null');
			c.eq('status', r.status, 502);
			c.eq('Notify request count', c.stub.received.length, 0);
		});

		add(kind, 'CORS preflight is answered for POST', 'OPTIONS with Origin: 200, allow-origin echoes the origin, allow-methods is POST; Notify is not called.', async (c) => {
			const r = await c.request({ method: 'OPTIONS', path: KINDS[kind].path, headers: { origin: 'http://localhost:4200', 'access-control-request-method': 'POST' } });
			c.eq('status', r.status, 200);
			c.eq('access-control-allow-origin', r.headers['access-control-allow-origin'], 'http://localhost:4200');
			c.eq('access-control-allow-methods', r.headers['access-control-allow-methods'], 'POST');
			c.eq('Notify request count', c.stub.received.length, 0);
		});

		add(kind, 'GET on the route is not routed', 'Only POST is registered: 404 route-not-found from the local emulator; Notify not called.', async (c) => {
			const r = await c.request({ method: 'GET', path: KINDS[kind].path });
			c.eq('status', r.status, 404);
			c.eq('Notify request count', c.stub.received.length, 0);
		});
	});

	list.push({
		kind: 'both',
		route: 'POST /dev/notifyEmail',
		title: 'Email: no stage prefix means no route',
		description: 'POST /notifyEmail (without /dev) is 404; Notify not called.',
		run: async (c) => {
			const r = await c.request({ method: 'POST', path: '/notifyEmail', body: f.payloadFor('email') });
			c.eq('status', r.status, 404);
			c.eq('Notify request count', c.stub.received.length, 0);
		},
	});

	return list;
}

module.exports = { buildScenarios, KINDS };
