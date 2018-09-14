export default class TemplateKeySelector {
	keyForEmail(email) {
		this.email = email;
		return email;
	}
	keyForSms(number) {
		this.number = number;
		return number;
	}
}
