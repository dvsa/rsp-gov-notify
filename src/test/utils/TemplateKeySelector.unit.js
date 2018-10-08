import 'babel-polyfill';
import expect from 'expect';
import sinon from 'sinon';
import config from '../../utils/config';

import TemplateKeySelector from '../../utils/TemplateKeySelector';

describe('TemplateKeySelector', () => {
	let templateKeySelector;

	before(async () => {
		sinon.stub(config, 'templateKeyEmailEnglish').returns('ENGLISH_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailFrench').returns('FRENCH_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailGerman').returns('GERMAN_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailPolish').returns('POLISH_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailSpanish').returns('SPANISH_EMAIL_KEY');
		sinon.stub(config, 'templateKeyEmailWelsh').returns('WELSH_EMAIL_KEY');
		sinon.stub(config, 'templateKeySmsEnglish').returns('ENGLISH_SMS_KEY');
		sinon.stub(config, 'templateKeySmsFrench').returns('FRENCH_SMS_KEY');
		sinon.stub(config, 'templateKeySmsGerman').returns('GERMAN_SMS_KEY');
		sinon.stub(config, 'templateKeySmsPolish').returns('POLISH_SMS_KEY');
		sinon.stub(config, 'templateKeySmsSpanish').returns('SPANISH_SMS_KEY');
		sinon.stub(config, 'templateKeySmsWelsh').returns('WELSH_SMS_KEY');
		templateKeySelector = new TemplateKeySelector();
	});

	after(() => {
		config.templateKeyEmailEnglish.restore();
		config.templateKeyEmailFrench.restore();
		config.templateKeyEmailGerman.restore();
		config.templateKeyEmailPolish.restore();
		config.templateKeyEmailSpanish.restore();
		config.templateKeyEmailWelsh.restore();
		config.templateKeySmsEnglish.restore();
		config.templateKeySmsFrench.restore();
		config.templateKeySmsGerman.restore();
		config.templateKeySmsPolish.restore();
		config.templateKeySmsSpanish.restore();
		config.templateKeySmsWelsh.restore();
	});

	context('keyForEmail', () => {
		it('should return the email envvars for the provided language', () => {
			expect(templateKeySelector.keyForEmail('en')).toEqual('ENGLISH_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('fr')).toEqual('FRENCH_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('de')).toEqual('GERMAN_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('pl')).toEqual('POLISH_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('es')).toEqual('SPANISH_EMAIL_KEY');
			expect(templateKeySelector.keyForEmail('cy')).toEqual('WELSH_EMAIL_KEY');
		});
	});

	context('keyForSms', () => {
		it('should return the sms envvars for the provided language', () => {
			expect(templateKeySelector.keyForSms('en')).toEqual('ENGLISH_SMS_KEY');
			expect(templateKeySelector.keyForSms('fr')).toEqual('FRENCH_SMS_KEY');
			expect(templateKeySelector.keyForSms('de')).toEqual('GERMAN_SMS_KEY');
			expect(templateKeySelector.keyForSms('pl')).toEqual('POLISH_SMS_KEY');
			expect(templateKeySelector.keyForSms('es')).toEqual('SPANISH_SMS_KEY');
			expect(templateKeySelector.keyForSms('cy')).toEqual('WELSH_SMS_KEY');
		});
	});
});
