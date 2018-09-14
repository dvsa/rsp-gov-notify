import expect from 'expect';

import TemplateKeySelector from '../../utils/TemplateKeySelector';

describe('TemplateKeySelector', () => {
	let templateKeySelector;

	context('keyForEmail', () => {
		beforeEach(() => {
			process.env.TEMPLATE_KEY_EMAIL_ENGLISH = 'ENGLISH_EMAIL_KEY';
			process.env.TEMPLATE_KEY_EMAIL_FRENCH = 'FRENCH_EMAIL_KEY';
			process.env.TEMPLATE_KEY_EMAIL_GERMAN = 'GERMAN_EMAIL_KEY';
			process.env.TEMPLATE_KEY_EMAIL_POLISH = 'POLISH_EMAIL_KEY';
			process.env.TEMPLATE_KEY_EMAIL_SPANISH = 'SPANISH_EMAIL_KEY';
			process.env.TEMPLATE_KEY_EMAIL_WELSH = 'WELSH_EMAIL_KEY';
			templateKeySelector = new TemplateKeySelector();
		});
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
		beforeEach(() => {
			process.env.TEMPLATE_KEY_SMS_ENGLISH = 'ENGLISH_SMS_KEY';
			process.env.TEMPLATE_KEY_SMS_FRENCH = 'FRENCH_SMS_KEY';
			process.env.TEMPLATE_KEY_SMS_GERMAN = 'GERMAN_SMS_KEY';
			process.env.TEMPLATE_KEY_SMS_POLISH = 'POLISH_SMS_KEY';
			process.env.TEMPLATE_KEY_SMS_SPANISH = 'SPANISH_SMS_KEY';
			process.env.TEMPLATE_KEY_SMS_WELSH = 'WELSH_SMS_KEY';
			templateKeySelector = new TemplateKeySelector();
		});
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
