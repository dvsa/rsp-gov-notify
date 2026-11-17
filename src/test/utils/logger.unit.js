import expect from 'expect';
import sinon from 'sinon';
import {
	logDebug,
	logError,
	logInfo,
	ServiceName,
} from '../../utils/logger';

describe('logger', () => {
	afterEach(() => {
		sinon.restore();
	});

	[
		{ method: logInfo, level: 'INFO', consoleMethod: 'log' },
		{ method: logDebug, level: 'DEBUG', consoleMethod: 'log' },
		{ method: logError, level: 'ERROR', consoleMethod: 'error' },
	].forEach(({ method, level, consoleMethod }) => {
		it(`writes ${level} messages as structured JSON`, () => {
			const consoleStub = sinon.stub(console, consoleMethod);
			const message = { detail: 'test message' };

			method('TestEvent', message);

			expect(JSON.parse(consoleStub.firstCall.args[0])).toEqual({
				logName: 'TestEvent',
				message,
				logLevel: level,
			});
		});
	});

	it('exports service names', () => {
		expect(ServiceName).toEqual({
			Payments: 'PaymentsService',
			CPMS: 'CPMSOrchestrationService',
			Documents: 'DocumentsService',
		});
	});
});
