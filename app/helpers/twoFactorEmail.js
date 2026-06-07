const { sendTransactionalEmail } = require('./transactionalEmail');
const { getUserLocale } = require('../email/locale');
const {
	COPY,
	buildTwoFactorEnabledEmailHtml,
} = require('../email/templates/twoFactorEnabled');

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

module.exports = {
	sendTwoFactorEnabledEmail,
};
