import { SecretsManager } from 'aws-sdk';
import { logInfo, logError } from './logger';

const configMetadata = {
	notifyApiKey: 'NOTIFY_API_KEY',
	paymentPortalUrl: 'PAYMENT_PORTAL_URL',
	templateKeyEmailEnglish: 'TEMPLATE_KEY_EMAIL_ENGLISH',
	templateKeyEmailFrench: 'TEMPLATE_KEY_EMAIL_FRENCH',
	templateKeyEmailGerman: 'TEMPLATE_KEY_EMAIL_GERMAN',
	templateKeyEmailPolish: 'TEMPLATE_KEY_EMAIL_POLISH',
	templateKeyEmailSpanish: 'TEMPLATE_KEY_EMAIL_SPANISH',
	templateKeyEmailWelsh: 'TEMPLATE_KEY_EMAIL_WELSH',
	templateKeySmsEnglish: 'TEMPLATE_KEY_SMS_ENGLISH',
	templateKeySmsFrench: 'TEMPLATE_KEY_SMS_FRENCH',
	templateKeySmsGerman: 'TEMPLATE_KEY_SMS_GERMAN',
	templateKeySmsPolish: 'TEMPLATE_KEY_SMS_POLISH',
	templateKeySmsSpanish: 'TEMPLATE_KEY_SMS_SPANISH',
	templateKeySmsWelsh: 'TEMPLATE_KEY_SMS_WELSH',
};

let configuration = {};
async function bootstrap() {
	return new Promise((resolve, reject) => {
		if (process.env.USE_SECRETS_MANAGER === 'true') {
			const SecretId = process.env.SECRETS_MANAGER_SECRET_NAME;
			logInfo('NotifySecretsManagerSecretId', { secretId: SecretId });
			const secretsManagerClient = new SecretsManager({ region: process.env.REGION });
			secretsManagerClient.getSecretValue({ SecretId }, (err, secretsManagerResponse) => {
				if (err) {
					logError('NotifySecretsManagerError', err.message);
					reject(err);
					return;
				}
				configuration = JSON.parse(secretsManagerResponse.SecretString);
				resolve(configuration);
			});
		} else {
			logInfo('NotifyServiceEnvVars', 'Using envvars for config');
			configuration = Object.values(configMetadata)
				.reduce((config, envkey) => ({ [envkey]: process.env[envkey], ...config }), configuration);
			resolve(configuration);
		}
	});
}

const fromConfiguration = configKey => () => {
	return configuration[configKey];
};

export default Object.keys(configMetadata)
	.reduce(
		(obj, metaKey) => ({ [metaKey]: fromConfiguration(configMetadata[metaKey]), ...obj }),
		{ bootstrap },
	);
