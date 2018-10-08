/* eslint-disable no-use-before-define */
import expect from 'expect';
import sinon from 'sinon';
import { NotifyClient } from 'notifications-node-client';

import config from '../../utils/config';
import NotifyService from '../../services/notifyService';
import TemplateKeySelector from '../../utils/TemplateKeySelector';

describe('notifyService', () => {
	context('notifyEmail', () => {
		let sendEmailStub;
		let templateKeySelectorStub;
		let personalisation;

		const emailAddr = 'joe.bloggs@example.com';
		const payload = {
			Token: '47bmo7p9syg',
			Email: 'joe.bloggs@example.com',
			Location: 'Somewhere',
			Amount: 180,
			Language: 'en',
			VehicleReg: 'AA123',
		};

		beforeEach(() => {
			personalisation = personalisationWithLink('https://portal.local/47bmo7p9syg');
			sendEmailStub = sinon.stub(NotifyClient.prototype, 'sendEmail');
			templateKeySelectorStub = sinon.stub(TemplateKeySelector.prototype, 'keyForEmail');
			sinon.stub(config, 'paymentPortalUrl').returns('https://portal.local');
			sinon.stub(config, 'notifyApiKey').returns('NOTIFY_API_KEY');
		});

		afterEach(() => {
			NotifyClient.prototype.sendEmail.restore();
			TemplateKeySelector.prototype.keyForEmail.restore();
			config.paymentPortalUrl.restore();
			config.notifyApiKey.restore();
		});

		context('when called with email, full payload for English language and callback', () => {
			beforeEach(() => {
				templateKeySelectorStub
					.withArgs('en')
					.returns('ENGLISH_EMAIL_TEMPLATE_KEY');
				sendEmailStub
					.withArgs('ENGLISH_EMAIL_TEMPLATE_KEY', emailAddr, personalisation)
					.resolves('notify client success');
			});
			it('should call the notify client correctly then call back', (done) => {
				NotifyService.email(emailAddr, payload, (callbackErr, callbackResp) => {
					sinon.assert.calledWith(sendEmailStub, 'ENGLISH_EMAIL_TEMPLATE_KEY', emailAddr, personalisation);
					expect(callbackErr).toBeNull();
					expect(callbackResp).toMatchObject({ statusCode: 200 });
					done();
				});
			});
		});
	});

	context('notifySms', () => {
		let sendSmsStub;
		let templateKeySelectorStub;

		beforeEach(() => {
			sendSmsStub = sinon.stub(NotifyClient.prototype, 'sendSms');
			templateKeySelectorStub = sinon.stub(TemplateKeySelector.prototype, 'keyForSms');
			sinon.stub(config, 'paymentPortalUrl').returns('https://portal.local');
			sinon.stub(config, 'notifyApiKey').returns('NOTIFY_API_KEY');
		});

		afterEach(() => {
			NotifyClient.prototype.sendSms.restore();
			TemplateKeySelector.prototype.keyForSms.restore();
			config.paymentPortalUrl.restore();
			config.notifyApiKey.restore();
		});

		context('when called with phone number, full payload for English language and callback', () => {
			let personalisation;

			beforeEach(() => {
				personalisation = personalisationWithLink('https://portal.local/47bmo7p9syg');
				templateKeySelectorStub
					.withArgs('en')
					.returns('ENGLISH_SMS_TEMPLATE_KEY');
				sendSmsStub
					.withArgs('ENGLISH_SMS_TEMPLATE_KEY', '12345', personalisation)
					.resolves('notify client success');
			});
			it('should call the notify client correctly then call back', (done) => {
				NotifyService.sms('12345', smsPayloadForLanguage('en'), (callbackErr, callbackResp) => {
					sinon.assert.calledWith(sendSmsStub, 'ENGLISH_SMS_TEMPLATE_KEY', '12345', personalisation);
					expect(callbackErr).toBeNull();
					expect(callbackResp).toMatchObject({ statusCode: 200 });
					done();
				});
			});
		});

		context('when called with phone number, full payload for French language and callback', () => {
			let personalisation;
			beforeEach(() => {
				personalisation = personalisationWithLink('https://portal.local/47bmo7p9syg?clang=fr');
				templateKeySelectorStub
					.withArgs('fr')
					.returns('FRENCH_SMS_TEMPLATE_KEY');

				sendSmsStub
					.withArgs('FRENCH_SMS_TEMPLATE_KEY', '12345', personalisation)
					.resolves('notify client success');
			});
			it('should call the notify client correctly then call back', (done) => {
				NotifyService.sms('12345', smsPayloadForLanguage('fr'), (callbackErr, callbackResp) => {
					sinon.assert.calledWith(sendSmsStub, 'FRENCH_SMS_TEMPLATE_KEY', '12345', personalisation);
					expect(callbackErr).toBeNull();
					expect(callbackResp).toMatchObject({ statusCode: 200 });
					done();
				});
			});
		});
	});
});

const smsPayloadForLanguage = (lang) => {
	return {
		Token: '47bmo7p9syg',
		PhoneNumber: '12345',
		Location: 'Somewhere',
		Amount: 180,
		Language: lang,
		VehicleReg: 'AA123',
	};
};

const personalisationWithLink = (link) => {
	return {
		personalisation: {
			'Plate No.': 'AA123',
			Location: 'Somewhere',
			Amount: 180,
			Hyperlink: link,
			Payment_code: '47bmo7p9syg',
		},
	};
};
