/* eslint-disable no-use-before-define */
import expect from 'expect';
import sinon from 'sinon';
import { NotifyClient } from 'notifications-node-client';
import * as logger from '../../utils/logger';
import config from '../../utils/config';
import NotifyService from '../../services/notifyService';
import TemplateKeySelector from '../../utils/TemplateKeySelector';

describe('notifyService', () => {
	context('notifyEmail', () => {
		let logInfoStub;
		let logErrorStub;
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
			logInfoStub = sinon.stub(logger, 'logInfo');
			logErrorStub = sinon.stub(logger, 'logError');
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
			logInfoStub.restore();
			logErrorStub.restore();
		});

		context('when called with email, full payload for English language and respond', () => {
			beforeEach(() => {
				templateKeySelectorStub
					.withArgs('en')
					.returns('ENGLISH_EMAIL_TEMPLATE_KEY');
				sendEmailStub
					.withArgs('ENGLISH_EMAIL_TEMPLATE_KEY', emailAddr, personalisation)
					.resolves({ data: { id: 'gov-notify-message-id' } });
			});
			it('should call the notify client correctly then respond', async () => {
				const response = await NotifyService.email(emailAddr, payload);
				sinon.assert.calledWith(sendEmailStub, 'ENGLISH_EMAIL_TEMPLATE_KEY', emailAddr, personalisation);
				expect(response).toMatchObject({ statusCode: 200 });
			});
			it('should call the notify client and log the message id', async () => {
				await NotifyService.email(emailAddr, payload);
				sinon.assert.calledWith(logInfoStub, 'SendEmailSuccess', { notifyMessageId: 'gov-notify-message-id' });
			});
		});

		context('when called with a non-English language', () => {
			it('selects the matching template and adds the language to the payment link', async () => {
				templateKeySelectorStub.withArgs('fr').returns('FRENCH_EMAIL_TEMPLATE_KEY');
				sendEmailStub.resolves({ data: { id: 'gov-notify-message-id' } });

				const response = await NotifyService.email(emailAddr, { ...payload, Language: 'fr' });

				expect(response).toMatchObject({ statusCode: 200 });
				sinon.assert.calledWith(
					sendEmailStub,
					'FRENCH_EMAIL_TEMPLATE_KEY',
					emailAddr,
					personalisationWithLink('https://portal.local/47bmo7p9syg?clang=fr'),
				);
			});
		});

		context('when the Notify response does not include message data', () => {
			it('logs that no message id was found', async () => {
				sendEmailStub.resolves({});

				await NotifyService.email(emailAddr, payload);

				sinon.assert.calledWith(logInfoStub, 'SendEmailSuccess', { notifyMessageId: 'no id found' });
			});
		});

		context('when Gov.Notify returns an error', () => {
			it('returns the error response and logs the Notify error', async () => {
				const error = {
					response: {
						data: {
							status_code: 429,
							errors: [{ error: 'RateLimitError', message: 'Too many requests' }],
						},
					},
				};
				sendEmailStub.rejects(error);

				const response = await NotifyService.email(emailAddr, payload);

				expect(response).toMatchObject({
					statusCode: 400,
					body: JSON.stringify({
						statusCode: 429,
						errors: [{ error: 'RateLimitError', message: 'Too many requests' }],
					}),
				});
				sinon.assert.calledWith(logErrorStub, 'SendEmailError', {
					notifyApiError: {
						statusCode: 429,
						errors: [{ error: 'RateLimitError', message: 'Too many requests' }],
					},
				});
			});

			it('returns a safe error response for unexpected failures', async () => {
				sendEmailStub.rejects(new Error('Notify unavailable'));

				const response = await NotifyService.email(emailAddr, payload);

				expect(response).toMatchObject({
					statusCode: 400,
					body: JSON.stringify({
						errors: [{
							error: 'RSPError',
							message: 'An unexpected error occurred. Notify unavailable',
						}],
					}),
				});
			});

			it('handles errors without a message or Notify response data', async () => {
				sendEmailStub.rejects({ response: {} });

				const response = await NotifyService.email(emailAddr, payload);

				expect(response).toMatchObject({
					statusCode: 400,
					body: JSON.stringify({
						errors: [{
							error: 'RSPError',
							message: 'An unexpected error occurred. ',
						}],
					}),
				});
			});
		});
	});

	context('notifySms', () => {
		let logInfoStub;
		let logErrorStub;
		let sendSmsStub;
		let templateKeySelectorStub;

		beforeEach(() => {
			logInfoStub = sinon.stub(logger, 'logInfo');
			logErrorStub = sinon.stub(logger, 'logError');
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
			logInfoStub.restore();
			logErrorStub.restore();
		});

		context('when called with phone number, full payload for English language and respond', () => {
			let personalisation;

			beforeEach(() => {
				personalisation = personalisationWithLink('https://portal.local/47bmo7p9syg');
				templateKeySelectorStub
					.withArgs('en')
					.returns('ENGLISH_SMS_TEMPLATE_KEY');
				sendSmsStub
					.withArgs('ENGLISH_SMS_TEMPLATE_KEY', '12345', personalisation)
					.resolves({ data: { id: 'gov-notify-message-id' } });
			});
			it('should call the notify client correctly then respond', async () => {
				const response = await NotifyService.sms('12345', smsPayloadForLanguage('en'));
				sinon.assert.calledWith(sendSmsStub, 'ENGLISH_SMS_TEMPLATE_KEY', '12345', personalisation);
				expect(response).toMatchObject({ statusCode: 200 });
			});
			it('should call the notify client and log the message id', async () => {
				await NotifyService.sms('12345', smsPayloadForLanguage('en'));
				sinon.assert.calledWith(logInfoStub, 'SendSmsSuccess', { notifyMessageId: 'gov-notify-message-id' });
			});
		});

		context('when the Notify response does not include message data', () => {
			it('logs that no message id was found', async () => {
				sendSmsStub.resolves({});

				await NotifyService.sms('12345', smsPayloadForLanguage('en'));

				sinon.assert.calledWith(logInfoStub, 'SendSmsSuccess', { notifyMessageId: 'no id found' });
			});
		});

		context('when error is returned, it is handled correctly', () => {
			let personalisation;

			beforeEach(() => {
				personalisation = personalisationWithLink('https://portal.local/47bmo7p9syg');
				templateKeySelectorStub
					.withArgs('en')
					.returns('ENGLISH_SMS_TEMPLATE_KEY');
				sendSmsStub
					.withArgs('ENGLISH_SMS_TEMPLATE_KEY', '12345', personalisation)
					.rejects({
						response: {
							data: {
								status_code: 400,
								errors: [{
									error: 'BadRequestError',
									message: "Can't send to this recipient using a team-only API key",
								}],
							},
						},
					});
			});
			it('should fail to send through the notify client and return the error', async () => {
				const response = await NotifyService.sms('12345', smsPayloadForLanguage('en'));
				expect(response).toMatchObject({
					statusCode: 400,
					body: JSON.stringify({
						statusCode: 400,
						errors: [{
							error: 'BadRequestError',
							message: "Can't send to this recipient using a team-only API key",
						}],
					}),
				});
			});
			it('should call the notify client and call the error logger', async () => {
				await NotifyService.sms('12345', smsPayloadForLanguage('en'));
				sinon.assert.calledWith(logErrorStub, 'SendSmsError', {
					notifyApiError: {
						statusCode: 400,
						errors: [
							{
								error: 'BadRequestError',
								message: "Can't send to this recipient using a team-only API key",
							},
						],
					},
				});
			});
		});

		context('when an unexpected error occurs, it is handled correctly', () => {
			let personalisation;

			beforeEach(() => {
				personalisation = personalisationWithLink('https://portal.local/47bmo7p9syg');
				templateKeySelectorStub
					.withArgs('en')
					.returns('ENGLISH_SMS_TEMPLATE_KEY');
				sendSmsStub
					.withArgs('ENGLISH_SMS_TEMPLATE_KEY', '12345', personalisation)
					.rejects(new Error('Something unexpected happened'));
			});
			it('should fail with unexpected error and handle error gracefully to the user', async () => {
				const response = await NotifyService.sms('12345', smsPayloadForLanguage('en'));
				expect(response).toMatchObject({
					statusCode: 400,
					body: JSON.stringify({
						errors: [{
							error: 'RSPError',
							message: 'An unexpected error occurred. Something unexpected happened',
						}],
					}),
				});
			});
		});

		context('when called with phone number, full payload for French language and respond', () => {
			let personalisation;
			beforeEach(() => {
				personalisation = personalisationWithLink('https://portal.local/47bmo7p9syg?clang=fr');
				templateKeySelectorStub
					.withArgs('fr')
					.returns('FRENCH_SMS_TEMPLATE_KEY');

				sendSmsStub
					.withArgs('FRENCH_SMS_TEMPLATE_KEY', '12345', personalisation)
					.resolves({ data: { id: 'gov-notify-message-id' } });
			});
			it('should call the notify client correctly then respond', async () => {
				const response = await NotifyService.sms('12345', smsPayloadForLanguage('fr'));
				sinon.assert.calledWith(sendSmsStub, 'FRENCH_SMS_TEMPLATE_KEY', '12345', personalisation);
				expect(response).toMatchObject({ statusCode: 200 });
			});
			it('should log the response id returned by the Notify client', async () => {
				await NotifyService.sms('12345', smsPayloadForLanguage('fr'));
				sinon.assert.calledWith(logInfoStub, 'SendSmsSuccess', { notifyMessageId: 'gov-notify-message-id' });
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
