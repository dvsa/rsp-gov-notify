import auth from './functions/auth';
import notifyEmail from './functions/notifyEmail';
import notifySms from './functions/notifySms';

const handler = {
	auth,
	notifyEmail,
	notifySms,
};

export default handler;
