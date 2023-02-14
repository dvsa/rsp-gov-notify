import Notify from '../services/notifyService';
import config from '../utils/config';
import { logError, logInfo } from '../utils/logger';

let configured = false;

export const handler = async (event) => {
	logInfo('SmsHandler');
	if (!configured) {
		await config.bootstrap();
		configured = true;
	}

	if (!event.body || !JSON.parse(event.body)) {
		logError('SmsHandlerError', 'Event body is missing or not valid JSON');
		throw new Error('Unable to process request.');
	}

	const notifyObject = JSON.parse(event.body);

	if (notifyObject.status) {
		return Notify.smsStatus(notifyObject.NotifyId, notifyObject);
	}

	return Notify.sms(notifyObject.PhoneNumber, notifyObject);
};

export default handler;
