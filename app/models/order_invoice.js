const fs = require('fs');
const path = require('path');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const axios = require('axios');
const knex = require('../db/knex');
const { getOrderHistoryPaginated } = require('./order_history');
const { getEffectiveBillingConfig } = require('./billingSettings');
const emailSender = require('../helpers/emailSender');
const orderEmailDebug = require('../helpers/orderEmailDebug');
const { getUserLocale } = require('../email/locale');
const {
	COPY: invoiceEmailCopy,
	buildInvoiceReceiptEmailHtml,
} = require('../email/templates/invoiceReceipt');

const PAID_STATUS = 3;

const buildInvoiceNumber = (config, orderId) => {
	const est = config.establishment_code || '001';
	const point = config.emission_point || '001';
	const seq = String(orderId).padStart(9, '0');
	return `${est}-${point}-${seq}`;
};

const generateElectronicInvoice = async (id_shopping_car, configOverride) => {
	const config = configOverride || await getEffectiveBillingConfig();

	if (!config.service_url) {
		throw new Error('No está configurada la URL del servicio de facturación electrónica');
	}

	const shopCartFelec = await axios({
		method: 'post',
		url: config.service_url,
		headers: { 'Content-Type': 'application/json' },
		params: {
			codigo: id_shopping_car,
			path: config.output_path,
			namefile: 'factura',
			jasper_file: config.jasper_path,
			ambiente: config.ambiente,
			ruc: config.company_ruc,
			razonSocial: config.company_legal_name,
			nombreComercial: config.company_trade_name,
			dirMatriz: config.company_address,
			firma: config.signature_path,
			claveFirma: config.signature_password,
		},
	});

	if (!shopCartFelec.data || !shopCartFelec.data.claveAcceso) {
		throw new Error('El servicio de facturación no devolvió una clave de acceso válida');
	}

	return {
		claveAcceso: shopCartFelec.data.claveAcceso,
		pathPdf: shopCartFelec.data.pathPdf,
		pathXml: shopCartFelec.data.pathXml,
	};
};

const buildInvoiceEmailHtml = buildInvoiceReceiptEmailHtml;

const sendInvoiceEmail = async ({
	to,
	customerName,
	orderNumber,
	invoiceNumber,
	accessKey,
	total,
	pathPdf,
	pathXml,
	userId,
	locale: localeOverride,
}) => {
	if (!process.env.SENDMAILTOKEN) {
		throw new Error('Falta SENDMAILTOKEN en .env');
	}

	const locale = localeOverride || (userId ? await getUserLocale(userId) : 'sp');
	const lang = locale === 'en' ? 'en' : 'sp';
	const brandName = process.env.MAIL_BRAND_NAME || 'ALL IN ONE';
	const t = invoiceEmailCopy[lang];

	const sender = emailSender.assertEmailSenderConfigured();
	const defaultClient = SibApiV3Sdk.ApiClient.instance;
	const apiKey = defaultClient.authentications['api-key'];
	apiKey.apiKey = process.env.SENDMAILTOKEN;

	const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
	const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
	sendSmtpEmail.subject = t.subject(brandName, orderNumber);
	sendSmtpEmail.htmlContent = buildInvoiceEmailHtml({
		locale,
		customerName,
		orderNumber,
		invoiceNumber,
		accessKey,
		total,
	});
	sendSmtpEmail.sender = sender;
	sendSmtpEmail.to = [{ email: to, name: customerName }];

	if (pathPdf && fs.existsSync(pathPdf) && pathXml && fs.existsSync(pathXml)) {
		const [base64Pdf, base64Xml] = await Promise.all([
			fs.promises.readFile(pathPdf, { encoding: 'base64' }),
			fs.promises.readFile(pathXml, { encoding: 'base64' }),
		]);
		sendSmtpEmail.attachment = [
			{ name: path.basename(pathPdf), content: base64Pdf },
			{ name: path.basename(pathXml), content: base64Xml },
		];
	}

	orderEmailDebug.logOrderEmail('invoice:send-server', { to, orderNumber });
	await apiInstance.sendTransacEmail(sendSmtpEmail);
};

const processInvoiceAfterPayment = async (id_shopping_car) => {
	const order = await knex('shopping_car')
		.where({ id_shopping_car })
		.first();

	if (!order) {
		throw new Error('Orden no encontrada');
	}

	if (parseInt(order.status, 10) !== PAID_STATUS) {
		throw new Error('La orden debe estar pagada para facturar');
	}

	if (parseInt(order.status_invoice, 10) === 1 && order.invoice_access_key) {
		return {
			success: true,
			alreadyInvoiced: true,
			invoiceNumber: order.invoice_number,
			claveAcceso: order.invoice_access_key,
		};
	}

	const config = await getEffectiveBillingConfig();

	if (!config.is_billing_enabled) {
		await knex('shopping_car')
			.where({ id_shopping_car })
			.update({
				status_invoice: 0,
				invoice_error: 'Facturación desactivada en configuración administrativa',
				updated_at: knex.fn.now(),
			});

		return {
			success: false,
			skipped: true,
			reason: 'billing_disabled',
			message: 'La facturación electrónica está desactivada',
		};
	}

	try {
		const invoiceResult = await generateElectronicInvoice(id_shopping_car, config);
		const invoiceNumber = buildInvoiceNumber(config, id_shopping_car);

		await knex('shopping_car')
			.where({ id_shopping_car })
			.update({
				status_invoice: 1,
				invoice_access_key: invoiceResult.claveAcceso,
				invoice_pdf_path: invoiceResult.pathPdf,
				invoice_xml_path: invoiceResult.pathXml,
				invoice_number: invoiceNumber,
				invoice_error: null,
				invoiced_at: knex.fn.now(),
				updated_at: knex.fn.now(),
			});

		const user = await knex('users').where({ id_users: order.id_user }).first();
		const customerName = user
			? `${user.name_user || ''} ${user.last_name_user || ''}`.trim()
			: 'Cliente';

		if (user && user.email) {
			try {
				await sendInvoiceEmail({
					to: user.email,
					customerName,
					orderNumber: String(id_shopping_car),
					invoiceNumber,
					accessKey: invoiceResult.claveAcceso,
					total: parseFloat(order.shopping_car_total || 0).toFixed(2),
					pathPdf: invoiceResult.pathPdf,
					pathXml: invoiceResult.pathXml,
					userId: order.id_user,
				});
			} catch (mailError) {
				orderEmailDebug.logOrderEmailApiError('invoice:mail-after-payment', mailError);
			}
		}

		return {
			success: true,
			invoiceNumber,
			...invoiceResult,
		};
	} catch (error) {
		await knex('shopping_car')
			.where({ id_shopping_car })
			.update({
				status_invoice: 0,
				invoice_error: error.message,
				updated_at: knex.fn.now(),
			});
		throw error;
	}
};

const reprocessInvoiceForOrder = async (id_shopping_car) => {
	const order = await knex('shopping_car')
		.where({ id_shopping_car })
		.first();

	if (!order) {
		throw new Error('Orden no encontrada');
	}

	if (parseInt(order.status, 10) !== PAID_STATUS) {
		throw new Error('La orden debe estar pagada para reprocesar la factura');
	}

	await processInvoiceAfterPayment(id_shopping_car);

	return knex('shopping_car')
		.where({ id_shopping_car })
		.first();
};

const reprocessOrderInvoice = async (id_shopping_car, id_user, page, limit) => {
	const order = await knex('shopping_car')
		.where({
			id_shopping_car,
			id_user,
		})
		.first();

	if (!order) {
		throw new Error('Orden no encontrada');
	}

	await reprocessInvoiceForOrder(id_shopping_car);

	return getOrderHistoryPaginated(id_user, page, limit);
};

module.exports = {
	buildInvoiceNumber,
	generateElectronicInvoice,
	processInvoiceAfterPayment,
	reprocessOrderInvoice,
	reprocessInvoiceForOrder,
	sendInvoiceEmail,
};
