import Notify from '../services/notifyService';

export default (event, context, callback) => {
	const notifyObject = JSON.parse(event.body);

	Notify.sms(notifyObject.PhoneNumber, notifyObject, callback);
};
