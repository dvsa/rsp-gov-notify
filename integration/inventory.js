'use strict';

/* Explicit handler / endpoint inventory (checked against source files by tooling tests). */
const STAGE = 'dev';

const handlers = [
	{
		exportName: 'handler (default export alias)',
		file: 'src/functions/notifyEmail.js',
		localFunction: 'notifyEmail',
		lambdaHandler: '.webpack/notifyEmail/app.handler',
		interface: 'HTTP',
		method: 'POST',
		route: 'notifyEmail',
		stagePrefix: STAGE,
		authorisation: 'aws_iam (deployed); bypassed locally by --noAuth',
		input: 'JSON body: Email, VehicleReg, Location, Language, Amount, Token',
		output: '200 {message} on success; 400 {statusCode?, errors[]} on Notify failure; thrown error on bad body',
		persistence: 'none',
		downstream: 'GOV.UK Notify sendEmail (external; stubbed locally); Secrets Manager only if USE_SECRETS_MANAGER=true (not exercised)',
	},
	{
		exportName: 'handler (default export alias)',
		file: 'src/functions/notifySms.js',
		localFunction: 'notifySms',
		lambdaHandler: '.webpack/notifySms/app.handler',
		interface: 'HTTP',
		method: 'POST',
		route: 'notifySms',
		stagePrefix: STAGE,
		authorisation: 'aws_iam (deployed); bypassed locally by --noAuth',
		input: 'JSON body: PhoneNumber, VehicleReg, Location, Language, Amount, Token',
		output: '200 {message} on success; 400 {statusCode?, errors[]} on Notify failure; thrown error on bad body',
		persistence: 'none',
		downstream: 'GOV.UK Notify sendSms (external; stubbed locally); Secrets Manager only if USE_SECRETS_MANAGER=true (not exercised)',
	},
];

module.exports = {
	STAGE,
	handlers,
	handlerCount: handlers.length,
	httpRouteCount: handlers.filter((h) => h.interface === 'HTTP').length,
	lambdaOnly: [],
	unverified: [
		'aws_iam authorisation (local run uses --noAuth)',
		'Real GOV.UK Notify delivery/response shapes (stubbed; real sends intentionally not implemented)',
		'Secrets Manager configuration path (USE_SECRETS_MANAGER=true)',
		'Deployed API Gateway behaviour (status mapping of thrown errors, CORS headers, throttling)',
	],
};
