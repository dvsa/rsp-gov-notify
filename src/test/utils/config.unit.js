import expect from 'expect';
import sinon from 'sinon';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import * as logger from '../../utils/logger';
import config from '../../utils/config';

describe('config', () => {
	let sendStub;
	let logErrorStub;
	let originalEnv;

	beforeEach(() => {
		originalEnv = {
			USE_SECRETS_MANAGER: process.env.USE_SECRETS_MANAGER,
			SECRETS_MANAGER_SECRET_NAME: process.env.SECRETS_MANAGER_SECRET_NAME,
			REGION: process.env.REGION,
		};
		process.env.USE_SECRETS_MANAGER = 'true';
		process.env.SECRETS_MANAGER_SECRET_NAME = 'notify-config';
		process.env.REGION = 'eu-west-1';
		sendStub = sinon.stub(SecretsManagerClient.prototype, 'send');
		sinon.stub(logger, 'logInfo');
		logErrorStub = sinon.stub(logger, 'logError');
	});

	afterEach(() => {
		sinon.restore();
		Object.entries(originalEnv).forEach(([key, value]) => {
			if (value === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = value;
			}
		});
	});

	it('loads configuration from Secrets Manager with a v3 command', async () => {
		sendStub.resolves({
			SecretString: JSON.stringify({ NOTIFY_API_KEY: 'test-key' }),
		});

		const result = await config.bootstrap();

		expect(result).toMatchObject({ NOTIFY_API_KEY: 'test-key' });
		sinon.assert.calledOnce(sendStub);
		expect(sendStub.firstCall.args[0]).toBeInstanceOf(GetSecretValueCommand);
		expect(sendStub.firstCall.args[0].input).toMatchObject({ SecretId: 'notify-config' });
	});

	it('logs and rethrows Secrets Manager failures', async () => {
		const error = new Error('Secrets Manager unavailable');
		sendStub.rejects(error);

		await expect(config.bootstrap()).rejects.toBe(error);
		sinon.assert.calledWith(logErrorStub, 'NotifySecretsManagerError', error.message);
	});

	it('logs and rethrows invalid Secrets Manager JSON', async () => {
		sendStub.resolves({ SecretString: '{invalid json' });

		await expect(config.bootstrap()).rejects.toThrow(SyntaxError);
		sinon.assert.calledWith(
			logErrorStub,
			'NotifySecretsManagerError',
			sinon.match.string,
		);
	});
});
