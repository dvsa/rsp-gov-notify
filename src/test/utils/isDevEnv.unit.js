import expect from 'expect';
import isDevEnv from '../../utils/isDevEnv';

describe('isDevEnv', () => {
	let originalEnv;

	beforeEach(() => {
		originalEnv = process.env.ENV;
	});

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.ENV;
		} else {
			process.env.ENV = originalEnv;
		}
	});

	it('returns true when the environment is DEV', () => {
		process.env.ENV = 'DEV';

		expect(isDevEnv()).toBe(true);
	});

	it('returns false for other and unset environments', () => {
		process.env.ENV = 'dev';
		expect(isDevEnv()).toBe(false);

		delete process.env.ENV;
		expect(isDevEnv()).toBe(false);
	});
});
