import { NotifyClient } from 'notifications-node-client';
import CreateResponse from '../utils/createResponse';

const notifyApiKey = process.env.NOTIFY_API_KEY;
const smsTemplateKey = process.env.SMS_TEMPLATE_KEY;
const emailTemplateKey = process.env.EMAIL_TEMPLATE_KEY;
const paymentPortalUrl = process.env.PAYMENT_PORTAL_URL;

export default class Notify {

	static sms(phoneNumber, templateObj, callback) {
		const notifyClient = new NotifyClient(notifyApiKey);

		notifyClient.sendSms(
			smsTemplateKey,
			phoneNumber,
			{
				personalisation: Notify.formatPersonalisationObject(templateObj),
			},
		).then((response) => {
			console.log(response);
			callback(
				null,
				Notify.SuccessfulResponse(),
			);
		}).catch((error) => {
			console.log(error);
			callback(null, Notify.ErrorResponse(error));
		});
	}

	static email(emailAddress, templateObj, callback) {
		const notifyClient = new NotifyClient(notifyApiKey);

		notifyClient.sendEmail(
			emailTemplateKey,
			emailAddress,
			{
				personalisation: Notify.formatPersonalisationObject(templateObj),
			},
		).then((response) => {
			console.log(response);
			callback(
				null,
				Notify.SuccessfulResponse(),
			);
		}).catch((error) => {
			console.log(error);
			callback(null, Notify.ErrorResponse(error));
		});
	}

	static formatPersonalisationObject(templateObj) {
		return {
			'Plate No.': templateObj.VehicleReg,
			Location: templateObj.Location,
			Amount: templateObj.Amount,
			Hyperlink: `${paymentPortalUrl}/${templateObj.Token}`,
		};
	}

	static formatErrorObject(errorResponse) {
		return {
			statusCode: errorResponse.error.status_code,
			errors: errorResponse.error.errors,
		};
	}

	static SuccessfulResponse() {
		return CreateResponse({ body: { message: 'Notification successfully sent to GOV.UK' }, statusCode: 200 });
	}

	static ErrorResponse(error) {
		return CreateResponse({
			body: Notify.formatErrorObject(error),
			statusCode: 400,
		});
	}
}
