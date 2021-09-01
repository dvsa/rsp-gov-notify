import { SecretsManager } from 'aws-sdk';
import { logInfo, logError } from './logger';

const configMetadata = {
	notifyApiKey: 'NOTIFY_API_KEY',
	paymentPortalUrl: 'PAYMENT_PORTAL_URL',
	templateKeyEmailBulgarian: 'TEMPLATE_KEY_EMAIL_BULGARIAN',
	templateKeyEmailCroatian: 'TEMPLATE_KEY_EMAIL_CROATIAN',
	templateKeyEmailCzech: 'TEMPLATE_KEY_EMAIL_CZECH',
	templateKeyEmailDutch: 'TEMPLATE_KEY_EMAIL_DUTCH',
	templateKeyEmailEnglish: 'TEMPLATE_KEY_EMAIL_ENGLISH',
	templateKeyEmailEstonian: 'TEMPLATE_KEY_EMAIL_ESTONIAN',
	templateKeyEmailFrench: 'TEMPLATE_KEY_EMAIL_FRENCH',
	templateKeyEmailGerman: 'TEMPLATE_KEY_EMAIL_GERMAN',
	templateKeyEmailGreek: 'TEMPLATE_KEY_EMAIL_GREEK',
	templateKeyEmailHungarian: 'TEMPLATE_KEY_EMAIL_HUNGARIAN',
	templateKeyEmailItalian: 'TEMPLATE_KEY_EMAIL_ITALIAN',
	templateKeyEmailLatvian: 'TEMPLATE_KEY_EMAIL_LATVIAN',
	templateKeyEmailLithuanian: 'TEMPLATE_KEY_EMAIL_LITHUANIAN',
	templateKeyEmailPolish: 'TEMPLATE_KEY_EMAIL_POLISH',
	templateKeyEmailPortuguese: 'TEMPLATE_KEY_EMAIL_PORTUGUESE',
	templateKeyEmailRomanian: 'TEMPLATE_KEY_EMAIL_ROMANIAN',
	templateKeyEmailRussian: 'TEMPLATE_KEY_EMAIL_RUSSIAN',
	templateKeyEmailSerbian: 'TEMPLATE_KEY_EMAIL_SERBIAN',
	templateKeyEmailSlovak: 'TEMPLATE_KEY_EMAIL_SLOVAK',
	templateKeyEmailSlovenian: 'TEMPLATE_KEY_EMAIL_SLOVENIAN',
	templateKeyEmailSpanish: 'TEMPLATE_KEY_EMAIL_SPANISH',
	templateKeyEmailTurkish: 'TEMPLATE_KEY_EMAIL_TURKISH',
	templateKeyEmailWelsh: 'TEMPLATE_KEY_EMAIL_WELSH',
	templateKeySmsBulgarian: 'TEMPLATE_KEY_SMS_BULGARIAN',
	templateKeySmsCroatian: 'TEMPLATE_KEY_SMS_CROATIAN',
	templateKeySmsCzech: 'TEMPLATE_KEY_SMS_CZECH',
	templateKeySmsDutch: 'TEMPLATE_KEY_SMS_DUTCH',
	templateKeySmsEnglish: 'TEMPLATE_KEY_SMS_ENGLISH',
	templateKeySmsEstonian: 'TEMPLATE_KEY_SMS_ESTONIAN',
	templateKeySmsFrench: 'TEMPLATE_KEY_SMS_FRENCH',
	templateKeySmsGerman: 'TEMPLATE_KEY_SMS_GERMAN',
	templateKeySmsGreek: 'TEMPLATE_KEY_SMS_GREEK',
	templateKeySmsHungarian: 'TEMPLATE_KEY_SMS_HUNGARIAN',
	templateKeySmsItalian: 'TEMPLATE_KEY_SMS_ITALIAN',
	templateKeySmsLatvian: 'TEMPLATE_KEY_SMS_LATVIAN',
	templateKeySmsLithuanian: 'TEMPLATE_KEY_SMS_LITHUANIAN',
	templateKeySmsPolish: 'TEMPLATE_KEY_SMS_POLISH',
	templateKeySmsPortuguese: 'TEMPLATE_KEY_SMS_PORTUGUESE',
	templateKeySmsRomanian: 'TEMPLATE_KEY_SMS_ROMANIAN',
	templateKeySmsRussian: 'TEMPLATE_KEY_SMS_RUSSIAN',
	templateKeySmsSerbian: 'TEMPLATE_KEY_SMS_SERBIAN',
	templateKeySmsSlovak: 'TEMPLATE_KEY_SMS_SLOVAK',
	templateKeySmsSlovenian: 'TEMPLATE_KEY_SMS_SLOVENIAN',
	templateKeySmsSpanish: 'TEMPLATE_KEY_SMS_SPANISH',
	templateKeySmsTurkish: 'TEMPLATE_KEY_SMS_TURKISH',
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
