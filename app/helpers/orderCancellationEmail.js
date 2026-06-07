const { sendTransactionalEmail } = require('./transactionalEmail');
const orderEmailDebug = require('./orderEmailDebug');
const { getUserLocale, formatEmailDate } = require('../email/locale');
const {
	COPY,
	buildOrderCancellationEmailHtml,
} = require('../email/templates/orderCancellation');

const sendOrderCancelledEmail = async ({ user, order, cancelledByAdmin = false, locale: localeOverride }) => {
	const siteUrl = (process.env.FRONTEND_URL || 'https://aioecuador.com').replace(/\/+$/, '') + '/';
	const logoUrl = `${siteUrl}static/images/logo/AIO_LOGO_NAME_ALL_WHITE.png`;
	const brandName = process.env.MAIL_BRAND_NAME || 'ALL IN ONE';
	const locale = localeOverride || await getUserLocale(user.id_users);
	const t = COPY[locale === 'en' ? 'en' : 'sp'];
	const customerName = `${user.name_user || ''} ${user.last_name_user || ''}`.trim() || t.defaultCustomer;
	const orderNumber = String(order.id_shopping_car);
	const date = formatEmailDate(locale);
	const total = parseFloat(order.shopping_car_total || 0).toFixed(2);

	const html = buildOrderCancellationEmailHtml({
		locale,
		siteUrl,
		logoUrl,
		customerName,
		orderNumber,
		date,
		total,
	});

	await sendTransactionalEmail({
		to: user.email,
		name: customerName,
		subject: t.subject(brandName, orderNumber),
		html,
	});

	if (process.env.ADMIN_EMAILS) {
		const adminTitle = cancelledByAdmin ? t.titleAdminByAdmin : t.titleAdminByClient;
		const adminHtml = buildOrderCancellationEmailHtml({
			locale: 'sp',
			siteUrl,
			logoUrl,
			customerName: `[ADMIN] ${customerName}`,
			orderNumber,
			date,
			total,
			titleOverride: adminTitle,
		});

		await sendTransactionalEmail({
			to: process.env.ADMIN_EMAILS.split(',')[0].trim(),
			name: 'Administración',
			subject: t.adminSubject(brandName, orderNumber, customerName),
			html: adminHtml,
		});
	}
};

const trySendOrderCancelledEmail = async ({ user, order, cancelledByAdmin = false }) => {
	try {
		await sendOrderCancelledEmail({ user, order, cancelledByAdmin });
	} catch (error) {
		orderEmailDebug.logOrderEmailApiError('order-cancel:email', error);
	}
};

module.exports = {
	buildOrderCancellationEmailHtml,
	sendOrderCancelledEmail,
	trySendOrderCancelledEmail,
};
