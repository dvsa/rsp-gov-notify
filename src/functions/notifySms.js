import Notify from '../services/notifyService';

export const handler = (event) => {
	const notifyObject = JSON.parse(event.body);

	return Notify.sms(notifyObject.PhoneNumber, notifyObject);
};

export default handler;
