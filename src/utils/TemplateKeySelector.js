import config from './config';

export default class TemplateKeySelector {

	constructor() {
		this.emailKeys = {
			bg: config.templateKeyEmailBulgarian(),
			cs: config.templateKeyEmailCzech(),
			cy: config.templateKeyEmailWelsh(),
			de: config.templateKeyEmailGerman(),
			el: config.templateKeyEmailGreek(),
			en: config.templateKeyEmailEnglish(),
			es: config.templateKeyEmailSpanish(),
			et: config.templateKeyEmailEstonian(),
			fr: config.templateKeyEmailFrench(),
			hr: config.templateKeyEmailCroatian(),
			hu: config.templateKeyEmailHungarian(),
			it: config.templateKeyEmailItalian(),
			lt: config.templateKeyEmailLithuanian(),
			lv: config.templateKeyEmailLatvian(),
			nl: config.templateKeyEmailDutch(),
			pl: config.templateKeyEmailPolish(),
			pt: config.templateKeyEmailPortuguese(),
			ro: config.templateKeyEmailRomanian(),
			ru: config.templateKeyEmailRussian(),
			sk: config.templateKeyEmailSlovakian(),
			sl: config.templateKeyEmailSlovenian(),
			sr: config.templateKeyEmailSerbian(),
			tk: config.templateKeyEmailTurkish(),
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
