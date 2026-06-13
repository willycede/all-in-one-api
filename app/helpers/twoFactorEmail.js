const SibApiV3Sdk = require('sib-api-v3-sdk');
const { sendTransactionalEmail } = require('./transactionalEmail');
const emailSender = require('./emailSender');
const orderEmailDebug = require('./orderEmailDebug');
const { getUserLocale, formatEmailDate } = require('../email/locale');
const {
	COPY,
	buildTwoFactorEnabledEmailHtml,
} = require('../email/templates/twoFactorEnabled');
const {
	COPY: ADMIN_DISABLED_COPY,
	buildTwoFactorAdminDisabledUserHtml,
	buildTwoFactorAdminDisabledAdminHtml,
} = require('../email/templates/twoFactorAdminDisabled');

const getAdminEmails = () => {
	const raw = process.env.ADMIN_EMAILS;
	if (!raw) return [];
	return raw.split(',').map((email) => email.trim()).filter(Boolean);
};

const sendToAdminEmails = async ({ subject, html }) => {
	const adminEmails = getAdminEmails();
	if (!adminEmails.length || !process.env.SENDMAILTOKEN) {
		return { sent: false, reason: 'admin_emails_or_token_missing' };
	}

	const sender = emailSender.assertEmailSenderConfigured();
	const defaultClient = SibApiV3Sdk.ApiClient.instance;
	const apiKey = defaultClient.authentications['api-key'];
	apiKey.apiKey = process.env.SENDMAILTOKEN;

	const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
	const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
	const brandName = process.env.MAIL_BRAND_NAME || 'ALL IN ONE';

	sendSmtpEmail.subject = subject;
	sendSmtpEmail.htmlContent = html;
	sendSmtpEmail.sender = sender;
	sendSmtpEmail.to = adminEmails.map((email) => ({ email, name: brandName }));

	orderEmailDebug.logOrderEmail('2fa:admin-disabled:admin-notify', { to: adminEmails, subject });
	await apiInstance.sendTransacEmail(sendSmtpEmail);
	return { sent: true };
};

const sendTwoFactorEnabledEmail = async ({ user, backupCodesCount, locale: localeOverride }) => {
	const siteUrl = (process.env.FRONTEND_URL || 'https://aioecuador.com').replace(/\/+$/, '') + '/';
	const logoUrl = `${siteUrl}static/images/logo/AIO_LOGO_NAME_ALL_WHITE.png`;
	const brandName = process.env.MAIL_BRAND_NAME || 'ALL IN ONE';
	const locale = localeOverride || await getUserLocale(user.id_users);
	const t = COPY[locale === 'en' ? 'en' : 'sp'];
	const customerName = `${user.name_user || ''} ${user.last_name_user || ''}`.trim() || t.defaultCustomer;

	await sendTransactionalEmail({
		to: user.email,
		name: customerName,
		subject: t.subject(brandName),
		html: buildTwoFactorEnabledEmailHtml({
			locale,
			customerName,
			siteUrl,
			logoUrl,
			backupCodesCount,
		}),
		notifyAdmin: true,
		adminSubject: t.adminSubject(brandName, customerName, user.email),
	});
};

const sendTwoFactorAdminDisabledEmail = async ({
	user,
	actor = null,
	reason = null,
	wasEnabled = false,
	hadPending = false,
	source = 'admin_panel',
	locale: localeOverride,
}) => {
	const siteUrl = (process.env.FRONTEND_URL || 'https://aioecuador.com').replace(/\/+$/, '') + '/';
	const logoUrl = `${siteUrl}static/images/logo/AIO_LOGO_NAME_ALL_WHITE.png`;
	const brandName = process.env.MAIL_BRAND_NAME || 'ALL IN ONE';
	const supportEmail = process.env.SUPPORT_EMAIL || 'soporte@allinone.com';
	const locale = localeOverride || await getUserLocale(user.id_users);
	const t = ADMIN_DISABLED_COPY[locale === 'en' ? 'en' : 'sp'];
	const customerName = `${user.name_user || ''} ${user.last_name_user || ''}`.trim() || t.defaultCustomer;
	const actorName = actor
		? `${actor.name_user || ''} ${actor.last_name_user || ''}`.trim() || actor.email
		: null;
	const dateLabel = formatEmailDate(locale);

	await sendTransactionalEmail({
		to: user.email,
		name: customerName,
		subject: t.userSubject(brandName),
		html: buildTwoFactorAdminDisabledUserHtml({
			locale,
			customerName,
			siteUrl,
			logoUrl,
			reason,
			supportEmail,
			source,
		}),
	});

	const adminSubject = source === 'cli'
		? t.cliAdminSubject(brandName, customerName, user.email)
		: t.adminSubject(brandName, customerName, user.email);

	await sendToAdminEmails({
		subject: adminSubject,
		html: buildTwoFactorAdminDisabledAdminHtml({
			locale: 'sp',
			siteUrl,
			customerName,
			customerEmail: user.email,
			actorName,
			actorEmail: actor && actor.email,
			reason,
			wasEnabled,
			hadPending,
			dateLabel,
			source,
		}),
	});
};

const trySendTwoFactorAdminDisabledEmail = async (payload) => {
	try {
		await sendTwoFactorAdminDisabledEmail(payload);
	} catch (error) {
		orderEmailDebug.logOrderEmailApiError('2fa:admin-disabled:email', error);
	}
};

module.exports = {
	sendTwoFactorEnabledEmail,
	sendTwoFactorAdminDisabledEmail,
	trySendTwoFactorAdminDisabledEmail,
};
