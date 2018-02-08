import Notify from '../services/notifyService';

export default (event, context, callback) => {
	const notifyObject = JSON.parse(event.body);

	Notify.email(notifyObject.Email, notifyObject, callback);
};
