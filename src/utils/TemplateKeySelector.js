export default class TemplateKeySelector {

	constructor() {
		this.emailKeys = {
			en: process.env.TEMPLATE_KEY_EMAIL_ENGLISH,
			fr: process.env.TEMPLATE_KEY_EMAIL_FRENCH,
			de: process.env.TEMPLATE_KEY_EMAIL_GERMAN,
			pl: process.env.TEMPLATE_KEY_EMAIL_POLISH,
			es: process.env.TEMPLATE_KEY_EMAIL_SPANISH,
			cy: process.env.TEMPLATE_KEY_EMAIL_WELSH,
		};
		this.smsKeys = {
			en: process.env.TEMPLATE_KEY_SMS_ENGLISH,
			fr: process.env.TEMPLATE_KEY_SMS_FRENCH,
			de: process.env.TEMPLATE_KEY_SMS_GERMAN,
			pl: process.env.TEMPLATE_KEY_SMS_POLISH,
			es: process.env.TEMPLATE_KEY_SMS_SPANISH,
			cy: process.env.TEMPLATE_KEY_SMS_WELSH,
		};
	}

	keyForEmail(language) {
		return this.emailKeys[language];
	}

	keyForSms(language) {
		return this.smsKeys[language];
	}

}
