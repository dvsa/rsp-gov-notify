import expect from 'expect';
import sinon from 'sinon';
import notifyEmail from '../../functions/notifyEmail';
import notifySms from '../../functions/notifySms';
import Notify from '../../services/notifyService';
import config from '../../utils/config';

const functions = [
	{ name: 'Email Function', service: notifyEmail },
	{ name: 'SMS Function', service: notifySms },
];

describe('notifyFunction', () => {
	let mockConfig;
	beforeEach(() => {
		sinon.stub(console, 'log');
		sinon.stub(console, 'error');
		sinon.stub(Notify, 'email').returns(Notify.SuccessfulResponse);
		sinon.stub(Notify, 'sms').returns(Notify.SuccessfulResponse);
		mockConfig = sinon.stub(config, 'bootstrap').resolves();
	});

	afterEach(() => {
		sinon.restore();
	});

	functions.forEach((event) => {
		it(`${event.name} should configure the lambda when invoked`, async () => {
			await event.service({ body: JSON.stringify({ valid: 'json' }) });
			expect(mockConfig.called).toBe(true);
		});
		it(`${event.name} should throw error if event body is missing`, async () => {
			expect(async () => {
				await event.service({});
			}).rejects.toThrow();
		});
		it(`${event.name} should throw error if event body JSON is invalid`, async () => {
			expect(async () => {
				await event.service({ body: 'something' });
			}).rejects.toThrow();
		});
		it(`${event.name} should return successfully with valid JSON`, async () => {
			const result = await event.service({ body: JSON.stringify({ valid: 'json' }) });
			expect(result).toBe(Notify.SuccessfulResponse);
		});
	});
});
