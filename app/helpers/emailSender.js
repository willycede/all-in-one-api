const getEmailSender = () => ({
	name: process.env.SENDMAIL_SENDER_NAME || 'All In One',
	email: process.env.SENDMAIL_SENDER_EMAIL || null,
});

const assertEmailSenderConfigured = () => {
	const sender = getEmailSender();
	if (!sender.email) {
		const err = new Error('Falta SENDMAIL_SENDER_EMAIL en .env. Debe ser un remitente validado en Brevo.');
		err.statusCode = 500;
		throw err;
	}
	return sender;
};

module.exports = {
	getEmailSender,
	assertEmailSenderConfigured,
};
