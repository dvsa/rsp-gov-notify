import { SecretsManager } from 'aws-sdk';

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
			console.log(`Pulling config from AWS Secrets Manager for secret ${SecretId}...`);
			const secretsManagerClient = new SecretsManager({ region: process.env.REGION });
			secretsManagerClient.getSecretValue({ SecretId }, (err, secretsManagerResponse) => {
				if (err) {
					console.log(err);
					reject(err);
				}
				configuration = JSON.parse(secretsManagerResponse.SecretString);
				console.log(`Cached ${Object.keys(configuration).length} config items from secrets manager`);
				resolve(configuration);
			});
		} else {
			console.log('Using envvars for config');
			configuration = Object.values(configMetadata)
				.reduce((config, envkey) => ({ [envkey]: process.env[envkey], ...config }), configuration);
			console.log('Finished getting envvars');
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
