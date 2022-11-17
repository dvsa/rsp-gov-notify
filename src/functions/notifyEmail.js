import Notify from '../services/notifyService';
import { logInfo } from '../utils/logger';

export const handler = (event) => {
	logInfo('EmailHandler');
	const notifyObject = JSON.parse(event.body);

	return Notify.email(notifyObject.Email, notifyObject);
};

export default handler;
