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
			sk: config.templateKeyEmailSlovak(),
			sl: config.templateKeyEmailSlovenian(),
			sr: config.templateKeyEmailSerbian(),
			tk: config.templateKeyEmailTurkish(),
			ua: config.templateKeyEmailUkraine(),
		};
		this.smsKeys = {
			bg: config.templateKeySmsBulgarian(),
			cs: config.templateKeySmsCzech(),
			cy: config.templateKeySmsWelsh(),
			de: config.templateKeySmsGerman(),
			el: config.templateKeySmsGreek(),
			en: config.templateKeySmsEnglish(),
			es: config.templateKeySmsSpanish(),
			et: config.templateKeySmsEstonian(),
			fr: config.templateKeySmsFrench(),
			hr: config.templateKeySmsCroatian(),
			hu: config.templateKeySmsHungarian(),
			it: config.templateKeySmsItalian(),
			lt: config.templateKeySmsLithuanian(),
			lv: config.templateKeySmsLatvian(),
			nl: config.templateKeySmsDutch(),
			pl: config.templateKeySmsPolish(),
			pt: config.templateKeySmsPortuguese(),
			ro: config.templateKeySmsRomanian(),
			ru: config.templateKeySmsRussian(),
			sk: config.templateKeySmsSlovak(),
			sl: config.templateKeySmsSlovenian(),
			sr: config.templateKeySmsSerbian(),
			tk: config.templateKeySmsTurkish(),
			ua: config.templateKeySmsUkraine(),
		};
	}

	keyForEmail(language) {
		return this.emailKeys[language];
	}

	keyForSms(language) {
		return this.smsKeys[language];
	}

}
