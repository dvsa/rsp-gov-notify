'use strict';

/*
 * Preloaded (node --require) into the service process started by the
 * integration runner ONLY. It makes real GOV.UK Notify delivery impossible:
 *   - https requests to the Notify host are redirected to the local stub;
 *   - any other non-loopback http/https/fetch request is blocked (fail closed)
 *     and logged as a host name only.
 * No production code is changed or imported.
 */
const http = require('http');
const https = require('https');

const NOTIFY_HOST = 'api.notifications.service.gov.uk';
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
const stubPort = Number(process.env.INTEGRATION_NOTIFY_STUB_PORT);

const hostOf = (opts) => String(opts.hostname || opts.host || '').replace(/:\d+$/, '').toLowerCase();

function block(host) {
	// eslint-disable-next-line no-console
	console.error(`INTEGRATION_GUARD_BLOCKED host=${host}`);
	throw new Error(`Integration guard blocked outbound request to ${host || 'unknown host'}`);
}

function normalise(args, defaultProtocol) {
	const [a, b, c] = args;
	if (typeof a === 'string' || a instanceof URL) {
		const u = new URL(a);
		const opts = {
			protocol: u.protocol, hostname: u.hostname, port: u.port, path: u.pathname + u.search,
		};
		if (typeof b === 'function') return { opts, cb: b };
		return { opts: { ...opts, ...b }, cb: c };
	}
	return { opts: { protocol: defaultProtocol, ...a }, cb: b };
}

function wrap(mod, protocol, name) {
	const original = mod[name];
	mod[name] = function guarded(...args) {
		const { opts, cb } = normalise(args, protocol);
		const host = hostOf(opts);
		if (host === NOTIFY_HOST && Number.isInteger(stubPort)) {
			const redirected = {
				...opts,
				protocol: 'http:',
				hostname: '127.0.0.1',
				host: '127.0.0.1',
				port: stubPort,
				agent: undefined,
				headers: { ...(opts.headers || {}), host: NOTIFY_HOST },
			};
			const req = http.request(redirected, cb);
			if (name === 'get') req.end();
			return req;
		}
		if (LOOPBACK.has(host)) return original.apply(mod, args);
		return block(host);
	};
}

if (Number.isInteger(stubPort)) {
	// eslint-disable-next-line no-console
	console.error('INTEGRATION_GUARD_ACTIVE');
	const httpRequest = http.request;
	wrap(https, 'https:', 'request');
	wrap(https, 'https:', 'get');
	// Allow loopback-only http (serverless-offline internals); block the rest.
	const originalHttpRequest = httpRequest;
	http.request = function guardedHttp(...args) {
		const { opts } = normalise(args, 'http:');
		const host = hostOf(opts);
		if (host === '' || LOOPBACK.has(host)) return originalHttpRequest.apply(http, args);
		return block(host);
	};
	if (typeof globalThis.fetch === 'function') {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = (input, init) => {
			const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
			if (!LOOPBACK.has(url.hostname)) block(url.hostname);
			return originalFetch(input, init);
		};
	}
}
