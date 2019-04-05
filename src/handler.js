import 'babel-polyfill';
import config from './utils/config';
import notifyEmail from './functions/notifyEmail';
import notifySms from './functions/notifySms';

let configured = false;
const configure = (lambdaFn) => {
	return async (event, context) => {
		if (!configured) {
			await config.bootstrap();
			configured = true;
		}
		return lambdaFn(event, context);
	};
};

const handler = {
	notifyEmail: configure(notifyEmail),
	notifySms: configure(notifySms),
};

export default handler;
