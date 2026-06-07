const SibApiV3Sdk = require('sib-api-v3-sdk');
const emailSender = require('./emailSender');
const orderEmailDebug = require('./orderEmailDebug');

const sendTransactionalEmail = async ({
	to,
	name,
	subject,
	html,
	notifyAdmin = false,
	adminSubject,
}) => {
	if (!process.env.SENDMAILTOKEN) {
		throw new Error('Falta SENDMAILTOKEN en .env');
	}

	const sender = emailSender.assertEmailSenderConfigured();

	if (!to) {
		throw new Error('Email destinatario requerido');
	}

	const defaultClient = SibApiV3Sdk.ApiClient.instance;
	const apiKey = defaultClient.authentications['api-key'];
	apiKey.apiKey = process.env.SENDMAILTOKEN;

	const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
	const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

	sendSmtpEmail.subject = subject;
	sendSmtpEmail.htmlContent = html;
	sendSmtpEmail.sender = sender;
	sendSmtpEmail.to = [{ email: to, name: name || 'All In One' }];

	orderEmailDebug.logOrderEmail('transactional:send', {
		to,
		subject,
		htmlLength: html ? html.length : 0,
	});

	const customerResult = await apiInstance.sendTransacEmail(sendSmtpEmail);

	orderEmailDebug.logOrderEmail('transactional:send:success', {
		messageId: customerResult.messageId,
	});

	if (notifyAdmin && process.env.ADMIN_EMAILS) {
		const adminEmails = process.env.ADMIN_EMAILS.split(',').map((email) => email.trim()).filter(Boolean);
		if (adminEmails.length) {
			sendSmtpEmail.to = adminEmails.map((email) => ({ email, name: 'All In One' }));
			sendSmtpEmail.subject = adminSubject || subject;
			await apiInstance.sendTransacEmail(sendSmtpEmail);
		}
	}

	return customerResult;
};

module.exports = {
	sendTransactionalEmail,
};
