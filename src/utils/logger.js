export const ServiceName = {
	Payments: 'PaymentsService',
	CPMS: 'CPMSOrchestrationService',
	Documents: 'DocumentsService',
};

export function logInfo(logName, message) {
	console.log(JSON.stringify({
		logName,
		message,
		logLevel: 'INFO',
	}, null, 2));
}

export function logError(logName, message) {
	console.error(JSON.stringify({
		logName,
		message,
		logLevel: 'ERROR',
	}, null, 2));
}
