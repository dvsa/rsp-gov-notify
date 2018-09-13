import expect from 'expect';
import sinon from 'sinon';
import { NotifyClient } from 'notifications-node-client';

import NotifyService from '../../services/notifyService';

describe('notifyService', () => {
	context('notifyEmail', () => {
		let sendEmailStub;
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
				Hyperlink: 'https://portal.com/47bmo7p9syg',
				Payment_code: '47bmo7p9syg',
			},
		};

		beforeEach(() => {
			sendEmailStub = sinon.stub(NotifyClient.prototype, 'sendEmail');
			process.env.NOTIFY_API_KEY = 'API_KEY';
			process.env.EMAIL_TEMPLATE_KEY = 'EMAIL_TEMPLATE_KEY';
			process.env.PAYMENT_PORTAL_URL = 'https://portal.com';
		});

		afterEach(() => {
			NotifyClient.prototype.sendEmail.restore();
		});

		context('when called with email, full payload for English language and callback', () => {
			beforeEach(() => {
				sendEmailStub
					.withArgs('EMAIL_TEMPLATE_KEY', emailAddr, expPersonalisation)
					.resolves('notify client success');
			});
			it('should call the notify client correctly then call back', (done) => {
				NotifyService.email(emailAddr, payload, (callbackErr, callbackResp) => {
					sinon.assert.calledWith(sendEmailStub, 'EMAIL_TEMPLATE_KEY', emailAddr, expPersonalisation);
					expect(callbackErr).toBeNull();
					expect(callbackResp).toMatchObject({ statusCode: 200 });
					done();
				});
			});
		});
	});
});
