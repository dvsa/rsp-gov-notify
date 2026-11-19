import expect from 'expect';
import sinon from 'sinon';
import { NotifyClient } from 'notifications-node-client';

describe('notifications-node-client compatibility', () => {
	let notifyClient;
	let postStub;

	beforeEach(() => {
		notifyClient = new NotifyClient('test-api-key');
		postStub = sinon.stub(notifyClient.apiClient, 'post');
	});

	afterEach(() => {
		sinon.restore();
	});

	it('sends email using the existing template, recipient and personalisation contract', async () => {
		const response = { data: { id: 'email-notification-id' } };
		postStub.resolves(response);
		const options = { personalisation: { name: 'Test' } };

		const result = await notifyClient.sendEmail('email-template', 'test@example.com', options);

		expect(result).toBe(response);
		sinon.assert.calledOnceWithExactly(postStub, '/v2/notifications/email', {
			template_id: 'email-template',
			email_address: 'test@example.com',
			personalisation: options.personalisation,
		});
	});

	it('sends SMS using the existing template, recipient and personalisation contract', async () => {
		const response = { data: { id: 'sms-notification-id' } };
		postStub.resolves(response);
		const options = { personalisation: { name: 'Test' } };

		const result = await notifyClient.sendSms('sms-template', '07123456789', options);

		expect(result).toBe(response);
		sinon.assert.calledOnceWithExactly(postStub, '/v2/notifications/sms', {
			template_id: 'sms-template',
			phone_number: '07123456789',
			personalisation: options.personalisation,
		});
	});
});
