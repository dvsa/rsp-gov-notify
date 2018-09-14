import { NotifyClient } from 'notifications-node-client';
import CreateResponse from '../utils/createResponse';
import TemplateKeySelector from '../utils/TemplateKeySelector';

const notifyApiKey = process.env.NOTIFY_API_KEY;
const paymentPortalUrl = process.env.PAYMENT_PORTAL_URL;

export default class Notify {

	static sms(phoneNumber, templateObj, callback) {
		const notifyClient = new NotifyClient(notifyApiKey);

		const templateKeySelector = new TemplateKeySelector();
		const templateKey = templateKeySelector.keyForEmail(templateObj.Language);

		notifyClient.sendSms(
			templateKey,
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

		const templateKeySelector = new TemplateKeySelector();
		const templateKey = templateKeySelector.keyForEmail(templateObj.Language);
		
		notifyClient.sendEmail(
			templateKey,
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
			Payment_code: templateObj.Token,
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
