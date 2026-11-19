'use strict';

/* Independent, hand-written service contract. Does NOT import production code. */

const LANGUAGES = {
	bg: 'BULGARIAN', cs: 'CZECH', cy: 'WELSH', de: 'GERMAN', el: 'GREEK', en: 'ENGLISH',
	es: 'SPANISH', et: 'ESTONIAN', fr: 'FRENCH', hr: 'CROATIAN', hu: 'HUNGARIAN', it: 'ITALIAN',
	lt: 'LITHUANIAN', lv: 'LATVIAN', nl: 'DUTCH', pl: 'POLISH', pt: 'PORTUGUESE', ro: 'ROMANIAN',
	ru: 'RUSSIAN', sk: 'SLOVAK', sl: 'SLOVENIAN', sr: 'SERBIAN', tk: 'TURKISH', ua: 'UKRAINE',
};

const PORTAL_URL = 'https://portal.integration.invalid/pay';
// Synthetic, well-formed Notify key: name-<service uuid>-<secret uuid>. Not a real key.
const API_KEY = 'rspintegration-00000000-0000-4000-8000-000000000001-00000000-0000-4000-8000-000000000002';

const templateKey = (kind, lang) => `int-tmpl-${kind}-${lang}`;

/** Environment for the locally started service (synthetic only). */
function serviceEnv() {
	const env = {
		USE_SECRETS_MANAGER: 'false',
		NOTIFY_API_KEY: API_KEY,
		PAYMENT_PORTAL_URL: PORTAL_URL,
	};
	Object.entries(LANGUAGES).forEach(([lang, name]) => {
		env[`TEMPLATE_KEY_EMAIL_${name}`] = templateKey('email', lang);
		env[`TEMPLATE_KEY_SMS_${name}`] = templateKey('sms', lang);
	});
	return env;
}

// Recipients are reserved/synthetic (example.com; Ofcom drama range 07700 900xxx).
const RECIPIENTS = {
	email: {
		ok: 'rsp.int.ok@example.com',
		400: 'rsp.int.400@example.com',
		403: 'rsp.int.403@example.com',
		429: 'rsp.int.429@example.com',
		500: 'rsp.int.500@example.com',
		drop: 'rsp.int.drop@example.com',
	},
	sms: {
		ok: '07700900001',
		400: '07700900002',
		403: '07700900003',
		429: '07700900004',
		500: '07700900005',
		drop: '07700900006',
	},
};

function stubTriggers() {
	const t = {};
	['email', 'sms'].forEach((k) => Object.entries(RECIPIENTS[k]).forEach(([mode, who]) => {
		if (mode !== 'ok') t[who] = mode === 'drop' ? 'drop' : Number(mode);
	}));
	return t;
}

const BASE_PAYLOAD = {
	VehicleReg: 'INT12XYZ',
	Location: 'Integration Test Depot',
	Language: 'en',
	Amount: 8000,
	Token: 'int0123456789abcdef',
};

const payloadFor = (kind, overrides = {}, mode = 'ok') => ({
	...(kind === 'email' ? { Email: RECIPIENTS.email[mode] } : { PhoneNumber: RECIPIENTS.sms[mode] }),
	...BASE_PAYLOAD,
	...overrides,
});

/** Request the service is expected to make to Notify. */
function expectedNotifyBody(kind, payload) {
	const lang = payload.Language;
	const link = `${PORTAL_URL}/${payload.Token}${lang !== 'en' ? `?clang=${lang}` : ''}`;
	return {
		template_id: LANGUAGES[lang] ? templateKey(kind, lang) : undefined,
		[kind === 'email' ? 'email_address' : 'phone_number']: kind === 'email' ? payload.Email : payload.PhoneNumber,
		personalisation: {
			'Plate No.': payload.VehicleReg,
			Location: payload.Location,
			Amount: payload.Amount,
			Hyperlink: link,
			Payment_code: payload.Token,
		},
	};
}

const notifyPath = (kind) => `/v2/notifications/${kind}`;

module.exports = {
	LANGUAGES, PORTAL_URL, serviceEnv, RECIPIENTS, stubTriggers, BASE_PAYLOAD, payloadFor, expectedNotifyBody, notifyPath, templateKey,
};
