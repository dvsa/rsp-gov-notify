import 'babel-polyfill';
import expect from 'expect';
import sinon from 'sinon';
import config from '../../utils/config';

import TemplateKeySelector from '../../utils/TemplateKeySelector';

describe('TemplateKeySelector', () => {
	let templateKeySelector;

	before(async () => {
		sinon.stub(config, 'templateKeyEmailBulgarian').returns('BULGARIAN_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailCroatian').returns('CROATIAN_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailCzech').returns('CZECH_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailDutch').returns('DUTCH_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailEnglish').returns('ENGLISH_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailEstonian').returns('ESTONIAN_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailFrench').returns('FRENCH_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailGerman').returns('GERMAN_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailGreek').returns('GREEK_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailHungarian').returns('HUNGARIAN_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailItalian').returns('ITALIAN_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailLatvian').returns('LATVIAN_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailLithuanian').returns('LITHUANIAN_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailPolish').returns('POLISH_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailPortuguese').returns('PORTUGUESE_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailRomanian').returns('ROMANIAN_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailRussian').returns('RUSSIAN_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailSerbian').returns('SERBIAN_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailSlovakian').returns('SLOVAKIAN_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailSlovenian').returns('SLOVENIAN_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailSpanish').returns('SPANISH_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailTurkish').returns('TURKISH_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailWelsh').returns('WELSH_EMAIL_KEY');

		sinon.stub(config, 'templateKeySmsBulgarian').returns('BULGARIAN_SMS_KEY');
		sinon.stub(config, 'templateKeySmsCroatian').returns('CROATIAN_SMS_KEY');
		sinon.stub(config, 'templateKeySmsCzech').returns('CZECH_SMS_KEY');
		sinon.stub(config, 'templateKeySmsDutch').returns('DUTCH_SMS_KEY');
		sinon.stub(config, 'templateKeySmsEnglish').returns('ENGLISH_SMS_KEY');
		sinon.stub(config, 'templateKeySmsEstonian').returns('ESTONIAN_SMS_KEY');
		sinon.stub(config, 'templateKeySmsFrench').returns('FRENCH_SMS_KEY');
		sinon.stub(config, 'templateKeySmsGerman').returns('GERMAN_SMS_KEY');
		sinon.stub(config, 'templateKeySmsGreek').returns('GREEK_SMS_KEY');
		sinon.stub(config, 'templateKeySmsHungarian').returns('HUNGARIAN_SMS_KEY');
		sinon.stub(config, 'templateKeySmsItalian').returns('ITALIAN_SMS_KEY');
		sinon.stub(config, 'templateKeySmsLatvian').returns('LATVIAN_SMS_KEY');
		sinon.stub(config, 'templateKeySmsLithuanian').returns('LITHUANIAN_SMS_KEY');
		sinon.stub(config, 'templateKeySmsPolish').returns('POLISH_SMS_KEY');
		sinon.stub(config, 'templateKeySmsPortuguese').returns('PORTUGUESE_SMS_KEY');
		sinon.stub(config, 'templateKeySmsRomanian').returns('ROMANIAN_SMS_KEY');
		sinon.stub(config, 'templateKeySmsRussian').returns('RUSSIAN_SMS_KEY');
		sinon.stub(config, 'templateKeySmsSerbian').returns('SERBIAN_SMS_KEY');
		sinon.stub(config, 'templateKeySmsSlovakian').returns('SLOVAKIAN_SMS_KEY');
		sinon.stub(config, 'templateKeySmsSlovenian').returns('SLOVENIAN_SMS_KEY');
		sinon.stub(config, 'templateKeySmsSpanish').returns('SPANISH_SMS_KEY');
		sinon.stub(config, 'templateKeySmsTurkish').returns('TURKISH_SMS_KEY');
		sinon.stub(config, 'templateKeySmsWelsh').returns('WELSH_SMS_KEY');

		templateKeySelector = new TemplateKeySelector();
	});

	after(() => {
		config.templateKeyEmailBulgarian.restore();
		config.templateKeyEmailCroatian.restore();
		config.templateKeyEmailCzech.restore();
		config.templateKeyEmailDutch.restore();
		config.templateKeyEmailEnglish.restore();
		config.templateKeyEmailEstonian.restore();
		config.templateKeyEmailFrench.restore();
		config.templateKeyEmailGerman.restore();
		config.templateKeyEmailGreek.restore();
		config.templateKeyEmailHungarian.restore();
		config.templateKeyEmailItalian.restore();
		config.templateKeyEmailLatvian.restore();
		config.templateKeyEmailLithuanian.restore();
		config.templateKeyEmailPolish.restore();
		config.templateKeyEmailPortuguese.restore();
		config.templateKeyEmailRomanian.restore();
		config.templateKeyEmailRussian.restore();
		config.templateKeyEmailSerbian.restore();
		config.templateKeyEmailSlovakian.restore();
		config.templateKeyEmailSlovenian.restore();
		config.templateKeyEmailSpanish.restore();
		config.templateKeyEmailTurkish.restore();
		config.templateKeyEmailWelsh.restore();

		config.templateKeySmsBulgarian.restore();
		config.templateKeySmsCroatian.restore();
		config.templateKeySmsCzech.restore();
		config.templateKeySmsDutch.restore();
		config.templateKeySmsEnglish.restore();
		config.templateKeySmsEstonian.restore();
		config.templateKeySmsFrench.restore();
		config.templateKeySmsGerman.restore();
		config.templateKeySmsGreek.restore();
		config.templateKeySmsHungarian.restore();
		config.templateKeySmsItalian.restore();
		config.templateKeySmsLatvian.restore();
		config.templateKeySmsLithuanian.restore();
		config.templateKeySmsPolish.restore();
		config.templateKeySmsPortuguese.restore();
		config.templateKeySmsRomanian.restore();
		config.templateKeySmsRussian.restore();
		config.templateKeySmsSerbian.restore();
		config.templateKeySmsSlovakian.restore();
		config.templateKeySmsSlovenian.restore();
		config.templateKeySmsSpanish.restore();
		config.templateKeySmsTurkish.restore();
		config.templateKeySmsWelsh.restore();
	});

	context('keyForEmail', () => {
		it('should return the email envvars for the provided language', () => {
			expect(templateKeySelector.keyForEmail('bg')).toEqual('BULGARIAN_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('hr')).toEqual('CROATIAN_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('cs')).toEqual('CZECH_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('nl')).toEqual('DUTCH_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('en')).toEqual('ENGLISH_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('et')).toEqual('ESTONIAN_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('fr')).toEqual('FRENCH_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('de')).toEqual('GERMAN_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('el')).toEqual('GREEK_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('hu')).toEqual('HUNGARIAN_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('it')).toEqual('ITALIAN_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('lv')).toEqual('LATVIAN_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('lt')).toEqual('LITHUANIAN_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('pl')).toEqual('POLISH_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('pt')).toEqual('PORTUGUESE_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('ro')).toEqual('ROMANIAN_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('ru')).toEqual('RUSSIAN_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('sr')).toEqual('SERBIAN_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('sk')).toEqual('SLOVAKIAN_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('sl')).toEqual('SLOVENIAN_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('es')).toEqual('SPANISH_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('tk')).toEqual('TURKISH_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('cy')).toEqual('WELSH_EMAIL_KEY');
		});
	});

	context('keyForSms', () => {
		it('should return the sms envvars for the provided language', () => {
			expect(templateKeySelector.keyForSms('bg')).toEqual('BULGARIAN_SMS_KEY');
			expect(templateKeySelector.keyForSms('hr')).toEqual('CROATIAN_SMS_KEY');
			expect(templateKeySelector.keyForSms('cs')).toEqual('CZECH_SMS_KEY');
			expect(templateKeySelector.keyForSms('nl')).toEqual('DUTCH_SMS_KEY');
			expect(templateKeySelector.keyForSms('en')).toEqual('ENGLISH_SMS_KEY');
			expect(templateKeySelector.keyForSms('et')).toEqual('ESTONIAN_SMS_KEY');
			expect(templateKeySelector.keyForSms('fr')).toEqual('FRENCH_SMS_KEY');
			expect(templateKeySelector.keyForSms('de')).toEqual('GERMAN_SMS_KEY');
			expect(templateKeySelector.keyForSms('el')).toEqual('GREEK_SMS_KEY');
			expect(templateKeySelector.keyForSms('hu')).toEqual('HUNGARIAN_SMS_KEY');
			expect(templateKeySelector.keyForSms('it')).toEqual('ITALIAN_SMS_KEY');
			expect(templateKeySelector.keyForSms('lv')).toEqual('LATVIAN_SMS_KEY');
			expect(templateKeySelector.keyForSms('lt')).toEqual('LITHUANIAN_SMS_KEY');
			expect(templateKeySelector.keyForSms('pl')).toEqual('POLISH_SMS_KEY');
			expect(templateKeySelector.keyForSms('pt')).toEqual('PORTUGUESE_SMS_KEY');
			expect(templateKeySelector.keyForSms('ro')).toEqual('ROMANIAN_SMS_KEY');
			expect(templateKeySelector.keyForSms('ru')).toEqual('RUSSIAN_SMS_KEY');
			expect(templateKeySelector.keyForSms('sr')).toEqual('SERBIAN_SMS_KEY');
			expect(templateKeySelector.keyForSms('sk')).toEqual('SLOVAKIAN_SMS_KEY');
			expect(templateKeySelector.keyForSms('sl')).toEqual('SLOVENIAN_SMS_KEY');
			expect(templateKeySelector.keyForSms('es')).toEqual('SPANISH_SMS_KEY');
			expect(templateKeySelector.keyForSms('tk')).toEqual('TURKISH_SMS_KEY');
			expect(templateKeySelector.keyForSms('cy')).toEqual('WELSH_SMS_KEY');
		});
	});
});
