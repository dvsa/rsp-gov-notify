'use strict';

const http = require('http');
const crypto = require('crypto');

/*
 * Local GOV.UK Notify stand-in. Behaviour is MODELLED, not captured from the
 * real service: error bodies follow the documented Notify error shape.
 * The recipient value selects the response so scenarios stay deterministic.
 */
const ERRORS = {
	400: { error: 'BadRequestError', message: 'Stub: recipient rejected' },
	403: { error: 'AuthError', message: 'Stub: invalid token' },
	429: { error: 'RateLimitError', message: 'Stub: rate limit exceeded' },
	500: { error: 'Exception', message: 'Stub: internal error' },
};

function createStub(triggers) {
	const received = [];
	const server = http.createServer((req, res) => {
		const chunks = [];
		req.on('data', (c) => chunks.push(c));
		req.on('end', () => {
			const raw = Buffer.concat(chunks).toString('utf8');
			let body;
			try { body = JSON.parse(raw); } catch (e) { body = undefined; }
			const auth = String(req.headers.authorization || '');
			received.push({
				method: req.method,
				path: req.url,
				host: req.headers.host,
				contentType: req.headers['content-type'],
				// Credential material is never retained: shape only.
				authShape: /^Bearer [\w-]+\.[\w-]+\.[\w-]+$/.test(auth) ? 'Bearer <jwt>' : 'unexpected',
				body,
			});
			const send = (status, payload) => {
				res.writeHead(status, { 'content-type': 'application/json' });
				res.end(JSON.stringify(payload));
			};
			const recipient = body && (body.email_address || body.phone_number);
			if (!body || !body.template_id || !recipient) {
				const field = !body || !body.template_id ? 'template_id' : 'recipient';
				return send(400, { status_code: 400, errors: [{ error: 'ValidationError', message: `Stub: ${field} is required` }] });
			}
			const mode = triggers[recipient];
			if (mode === 'drop') return req.socket.destroy();
			if (ERRORS[mode]) return send(mode, { status_code: mode, errors: [ERRORS[mode]] });
			return send(201, { id: crypto.randomUUID(), content: { body: 'stub' } });
		});
	});
	return {
		received,
		reset: () => { received.length = 0; },
		start: () => new Promise((resolve, reject) => {
			server.once('error', reject);
			server.listen(0, '127.0.0.1', () => resolve(server.address().port));
		}),
		stop: () => new Promise((resolve) => { server.closeAllConnections(); server.close(() => resolve()); }),
	};
}

module.exports = { createStub };
