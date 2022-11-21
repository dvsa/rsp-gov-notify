import Notify from '../services/notifyService';
import config from '../utils/config';
import { logError, logInfo } from '../utils/logger';

let configured = false;

export const handler = async (event) => {
	logInfo('EmailHandler');
	if (!configured) {
		await config.bootstrap();
		configured = true;
	}

	if (!event.body || !JSON.parse(event.body)) {
		logError('EmailHandlerError', 'Event body is missing or not valid JSON');
		throw new Error('Unable to process request.');
	}

	const notifyObject = JSON.parse(event.body);

	return Notify.email(notifyObject.Email, notifyObject);
};

export default handler;
