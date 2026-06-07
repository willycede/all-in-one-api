const isOrderEmailDebugEnabled = () => String(process.env.ORDER_EMAIL_DEBUG || '1') !== '0';

const logOrderEmail = (step, payload) => {
	if (!isOrderEmailDebugEnabled()) {
		return;
	}

	const entry = {
		ts: new Date().toISOString(),
		step,
		...payload,
	};

	console.log(`[order-email] ${JSON.stringify(entry, null, 2)}`);
};

const readOrderEmailEnv = () => ({
	SENDMAILTOKEN: process.env.SENDMAILTOKEN || null,
	SENDMAIL_SENDER_EMAIL: process.env.SENDMAIL_SENDER_EMAIL || null,
	SENDMAIL_SENDER_NAME: process.env.SENDMAIL_SENDER_NAME || 'All In One',
	ADMIN_EMAILS: process.env.ADMIN_EMAILS || null,
});

const logOrderEmailEnv = (step) => {
	const env = readOrderEmailEnv();
	logOrderEmail(step, {
		env,
		notes: {
			provider: 'Brevo (Sendinblue) sib-api-v3-sdk',
			sendmailTokenConfigured: !!env.SENDMAILTOKEN,
			senderEmailConfigured: !!env.SENDMAIL_SENDER_EMAIL,
			adminEmailsConfigured: !!env.ADMIN_EMAILS,
		},
	});
};

const logOrderEmailApiError = (step, error) => {
	logOrderEmail(step, {
		errorMessage: error.message,
		brevoBody: error.response && error.response.body,
		brevoText: error.response && error.response.text,
		brevoStatusCode: error.response && error.response.statusCode,
	});
};

module.exports = {
	isOrderEmailDebugEnabled,
	logOrderEmail,
	logOrderEmailEnv,
	readOrderEmailEnv,
	logOrderEmailApiError,
};
