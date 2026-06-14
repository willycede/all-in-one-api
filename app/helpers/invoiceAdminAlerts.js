const SibApiV3Sdk = require('sib-api-v3-sdk');
const knex = require('../db/knex');
const emailSender = require('./emailSender');
const orderEmailDebug = require('./orderEmailDebug');
const {
	COPY,
	buildInvoiceFailureAdminHtml,
} = require('../email/templates/invoiceFailureAdmin');

const PAID_STATUS = 3;
const DEFAULT_ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const getAdminEmails = () => {
	const raw = process.env.ADMIN_EMAILS;
	if (!raw) return [];
	return raw.split(',').map((email) => email.trim()).filter(Boolean);
};

const getAlertCooldownMs = () => {
	const parsed = parseInt(process.env.INVOICE_ALERT_COOLDOWN_MS, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_ALERT_COOLDOWN_MS;
};

const canSendInvoiceAlertForOrder = async (orderId) => {
	const order = await knex('shopping_car')
		.where({ id_shopping_car: orderId })
		.first('invoice_alert_muted', 'invoice_alert_last_sent_at');

	if (!order) {
		return { allowed: false, reason: 'order_not_found' };
	}

	if (order.invoice_alert_muted) {
		return { allowed: false, reason: 'muted' };
	}

	if (order.invoice_alert_last_sent_at) {
		const elapsed = Date.now() - new Date(order.invoice_alert_last_sent_at).getTime();
		if (elapsed < getAlertCooldownMs()) {
			return { allowed: false, reason: 'cooldown' };
		}
	}

	return { allowed: true };
};

const markInvoiceAlertsSent = async (orderIds) => {
	const ids = [...new Set((orderIds || []).filter(Boolean))];
	if (!ids.length) {
		return;
	}

	await knex('shopping_car')
		.whereIn('id_shopping_car', ids)
		.update({ invoice_alert_last_sent_at: knex.fn.now() });
};

const getFailedInvoiceOrders = async (limit = 10) => knex('shopping_car as sc')
	.leftJoin('users as u', 'u.id_users', 'sc.id_user')
	.select(
		'sc.id_shopping_car',
		'sc.invoice_error',
		'sc.updated_at',
		'sc.shopping_car_total',
		'sc.invoice_alert_muted',
		'u.name_user',
		'u.last_name_user',
		'u.email'
	)
	.where('sc.status', PAID_STATUS)
	.whereNotNull('sc.invoice_error')
	.where(function builder() {
		this.where('sc.status_invoice', 0).orWhereNull('sc.status_invoice');
	})
	.orderBy('sc.updated_at', 'desc')
	.limit(limit);

const getInvoiceAlertSummary = async () => {
	const countResult = await knex('shopping_car')
		.where({ status: PAID_STATUS })
		.whereNotNull('invoice_error')
		.where(function builder() {
			this.where('status_invoice', 0).orWhereNull('status_invoice');
		})
		.count({ total: 'id_shopping_car' })
		.first();

	const count = Number((countResult && countResult.total) || 0);
	const orders = count > 0 ? await getFailedInvoiceOrders(8) : [];

	return { count, orders };
};

const sendAdminInvoiceFailureEmail = async ({ orders, locale = 'sp' }) => {
	const adminEmails = getAdminEmails();
	if (!adminEmails.length || !process.env.SENDMAILTOKEN) {
		return { sent: false, reason: 'admin_emails_or_token_missing' };
	}

	const list = Array.isArray(orders) ? orders : [orders];
	if (!list.length) {
		return { sent: false, reason: 'empty_orders' };
	}

	const brandName = process.env.MAIL_BRAND_NAME || 'ALL IN ONE';
	const lang = locale === 'en' ? 'en' : 'sp';
	const t = COPY[lang];
	const subject = list.length === 1
		? t.subjectSingle(brandName, list[0].id_shopping_car)
		: t.subject(brandName, list.length);

	const sender = emailSender.assertEmailSenderConfigured();
	const defaultClient = SibApiV3Sdk.ApiClient.instance;
	const apiKey = defaultClient.authentications['api-key'];
	apiKey.apiKey = process.env.SENDMAILTOKEN;

	const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
	const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
	sendSmtpEmail.subject = subject;
	sendSmtpEmail.htmlContent = buildInvoiceFailureAdminHtml({ locale, orders: list });
	sendSmtpEmail.sender = sender;
	sendSmtpEmail.to = adminEmails.map((email) => ({ email, name: brandName }));

	orderEmailDebug.logOrderEmail('invoice:admin-alert', {
		to: adminEmails,
		orderIds: list.map((row) => row.id_shopping_car),
	});

	await apiInstance.sendTransacEmail(sendSmtpEmail);
	return { sent: true, count: list.length };
};

const notifyAdminInvoiceFailure = async (orderId, errorMessage) => {
	try {
		const eligibility = await canSendInvoiceAlertForOrder(orderId);
		if (!eligibility.allowed) {
			orderEmailDebug.logOrderEmail('invoice:admin-alert:skipped', {
				orderId,
				reason: eligibility.reason,
			});
			return { sent: false, reason: eligibility.reason };
		}

		const order = await knex('shopping_car')
			.where({ id_shopping_car: orderId })
			.first();

		const result = await sendAdminInvoiceFailureEmail({
			orders: [{
				id_shopping_car: orderId,
				invoice_error: errorMessage || (order && order.invoice_error),
			}],
		});

		if (result.sent) {
			await markInvoiceAlertsSent([orderId]);
		}

		return result;
	} catch (error) {
		orderEmailDebug.logOrderEmailApiError('invoice:admin-alert', error);
		return { sent: false, reason: error.message };
	}
};

const notifyAdminInvoiceFailureBatch = async (failures) => {
	if (!failures || !failures.length) {
		return { sent: false, reason: 'empty' };
	}

	try {
		const eligible = [];
		for (const item of failures) {
			const eligibility = await canSendInvoiceAlertForOrder(item.orderId);
			if (eligibility.allowed) {
				eligible.push(item);
			}
		}

		if (!eligible.length) {
			orderEmailDebug.logOrderEmail('invoice:admin-alert-batch:skipped', {
				reason: 'all_muted_or_cooldown',
				orderIds: failures.map((item) => item.orderId),
			});
			return { sent: false, reason: 'all_muted_or_cooldown' };
		}

		const orders = await Promise.all(eligible.map(async (item) => {
			const row = await knex('shopping_car')
				.where({ id_shopping_car: item.orderId })
				.first();
			return {
				id_shopping_car: item.orderId,
				invoice_error: item.message || (row && row.invoice_error),
			};
		}));

		const result = await sendAdminInvoiceFailureEmail({ orders });

		if (result.sent) {
			await markInvoiceAlertsSent(eligible.map((item) => item.orderId));
		}

		return result;
	} catch (error) {
		orderEmailDebug.logOrderEmailApiError('invoice:admin-alert-batch', error);
		return { sent: false, reason: error.message };
	}
};

module.exports = {
	getFailedInvoiceOrders,
	getInvoiceAlertSummary,
	notifyAdminInvoiceFailure,
	notifyAdminInvoiceFailureBatch,
	sendAdminInvoiceFailureEmail,
	canSendInvoiceAlertForOrder,
	markInvoiceAlertsSent,
	getAlertCooldownMs,
};
