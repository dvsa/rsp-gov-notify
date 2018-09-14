import expect from 'expect';
import sinon from 'sinon';
import { NotifyClient } from 'notifications-node-client';

import NotifyService from '../../services/notifyService';
import TemplateKeySelector from '../../utils/TemplateKeySelector';

describe('notifyService', () => {
	context('notifyEmail', () => {
		let sendEmailStub;
		let templateKeySelectorStub;

		const emailAddr = 'joe.bloggs@example.com';
		const payload = {
			Token: '47bmo7p9syg',
			Email: 'joe.bloggs@example.com',
			Location: 'Somewhere',
			Amount: 180,
			Language: 'en',
			VehicleReg: 'AA123',
		};
		const expPersonalisation = {
			personalisation: {
				'Plate No.': 'AA123',
				Location: 'Somewhere',
				Amount: 180,
				Hyperlink: 'https://portal.local/47bmo7p9syg',
				Payment_code: '47bmo7p9syg',
			},
		};

		beforeEach(() => {
			sendEmailStub = sinon.stub(NotifyClient.prototype, 'sendEmail');
			templateKeySelectorStub = sinon.stub(TemplateKeySelector.prototype, 'keyForEmail');
			process.env.PAYMENT_PORTAL_URL = 'https://portal.local';
			process.env.NOTIFY_API_KEY = 'NOTIFY_API_KEY';
		});

		afterEach(() => {
			NotifyClient.prototype.sendEmail.restore();
			TemplateKeySelector.prototype.keyForEmail.restore();
		});

		context('when called with email, full payload for English language and callback', () => {
			beforeEach(() => {
				templateKeySelectorStub
					.withArgs('en')
					.returns('ENGLISH_EMAIL_TEMPLATE_KEY');
				sendEmailStub
					.withArgs('ENGLISH_EMAIL_TEMPLATE_KEY', emailAddr, expPersonalisation)
					.resolves('notify client success');
			});
			it('should call the notify client correctly then call back', (done) => {
				NotifyService.email(emailAddr, payload, (callbackErr, callbackResp) => {
					sinon.assert.calledWith(sendEmailStub, 'ENGLISH_EMAIL_TEMPLATE_KEY', emailAddr, expPersonalisation);
					expect(callbackErr).toBeNull();
					expect(callbackResp).toMatchObject({ statusCode: 200 });
					done();
				});
			});
		});
	});
});
