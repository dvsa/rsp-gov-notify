import { NotifyClient } from 'notifications-node-client';
import config from '../utils/config';
import CreateResponse from '../utils/createResponse';
import TemplateKeySelector from '../utils/TemplateKeySelector';
import { logInfo, logError } from '../utils/logger';

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
			logInfo('SendSmsSuccess', {
				notifyMessageId: response.data ? response.data.id : 'no id found',
			});
			return Notify.SuccessfulResponse();
		} catch (error) {
			logError('SendSmsError', {
				notifyApiError: Notify.formatErrorObject(error),
			});
			return Notify.ErrorResponse(error);
		}
	}

	static async email(emailAddress, templateObj) {
		const notifyApiKey = config.notifyApiKey();
		const notifyClient = new NotifyClient(notifyApiKey);

		const templateKeySelector = new TemplateKeySelector();
		const templateKey = templateKeySelector.keyForEmail(templateObj.Language);

		try {
			const response = await notifyClient.sendEmail(
				templateKey,
				emailAddress,
				{
					personalisation: Notify.formatPersonalisationObject(templateObj),
				},
			);

			logInfo('SendEmailSuccess', {
				notifyMessageId: response.data ? response.data.id : 'no id found',
			});
			return Notify.SuccessfulResponse();
		} catch (error) {
			logError('SendEmailError', {
				notifyApiError: Notify.formatErrorObject(error),
			});
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
		if (errorResponse.response && errorResponse.response.data) {
			return {
				statusCode: errorResponse.response.data.status_code,
				errors: errorResponse.response.data.errors,
			};
		}
		return {
			errors: [{
				error: 'RSPError',
				message: `An unexpected error occurred. ${errorResponse.message ? errorResponse.message : ''}`,
			}],
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
