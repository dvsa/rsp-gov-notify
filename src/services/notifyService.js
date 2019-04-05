import { NotifyClient } from 'notifications-node-client';
import config from '../utils/config';
import CreateResponse from '../utils/createResponse';
import TemplateKeySelector from '../utils/TemplateKeySelector';

export default class Notify {

	static async sms(phoneNumber, templateObj) {
		const notifyApiKey = config.notifyApiKey();
		const notifyClient = new NotifyClient(notifyApiKey);

		const templateKeySelector = new TemplateKeySelector();
		const templateKey = templateKeySelector.keyForSms(templateObj.Language);

		try {
			const response = await notifyClient.sendSms(
				templateKey,
				phoneNumber,
				{
					personalisation: Notify.formatPersonalisationObject(templateObj),
				},
			);
			console.log(response);
			return Notify.SuccessfulResponse();
		} catch (error) {
			return Notify.ErrorResponse(error);
		}
	}

	static async email(emailAddress, templateObj) {
		const notifyApiKey = config.notifyApiKey();
		const notifyClient = new NotifyClient(notifyApiKey);

		const templateKeySelector = new TemplateKeySelector();
		const templateKey = templateKeySelector.keyForEmail(templateObj.Language);

		try {
			const response = notifyClient.sendEmail(
				templateKey,
				emailAddress,
				{
					personalisation: Notify.formatPersonalisationObject(templateObj),
				},
			);
			console.log(response);
			return Notify.SuccessfulResponse();
		} catch (error) {
			console.log(error);
			return Notify.ErrorResponse(error);
		}
	}

	static formatPersonalisationObject(templateObj) {
		const paymentPortalUrl = config.paymentPortalUrl();
		const langParam = templateObj.Language !== 'en' ? `?clang=${templateObj.Language}` : '';
		const link = `${paymentPortalUrl}/${templateObj.Token}${langParam}`;
		return {
			'Plate No.': templateObj.VehicleReg,
			Location: templateObj.Location,
			Amount: templateObj.Amount,
			Hyperlink: link,
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
