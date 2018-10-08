import config from './config';

export default class TemplateKeySelector {

	constructor() {
		this.emailKeys = {
			en: config.templateKeyEmailEnglish(),
			fr: config.templateKeyEmailFrench(),
			de: config.templateKeyEmailGerman(),
			pl: config.templateKeyEmailPolish(),
			es: config.templateKeyEmailSpanish(),
			cy: config.templateKeyEmailWelsh(),
		};
		this.smsKeys = {
			en: config.templateKeySmsEnglish(),
			fr: config.templateKeySmsFrench(),
			de: config.templateKeySmsGerman(),
			pl: config.templateKeySmsPolish(),
			es: config.templateKeySmsSpanish(),
			cy: config.templateKeySmsWelsh(),
		};
	}

	keyForEmail(language) {
		return this.emailKeys[language];
	}

	keyForSms(language) {
		return this.smsKeys[language];
	}

}
