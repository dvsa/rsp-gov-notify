import Notify from '../services/notifyService';

export default (event) => {
	const notifyObject = JSON.parse(event.body);

	return Notify.sms(notifyObject.PhoneNumber, notifyObject);
};
