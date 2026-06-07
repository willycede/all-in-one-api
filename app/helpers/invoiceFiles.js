const fs = require('fs');
const path = require('path');
const knex = require('../db/knex');

const FILE_TYPES = {
	pdf: {
		column: 'invoice_pdf_path',
		mime: 'application/pdf',
		ext: 'pdf',
	},
	xml: {
		column: 'invoice_xml_path',
		mime: 'application/xml',
		ext: 'xml',
	},
};

const fileExists = (filePath) => {
	if (!filePath) {
		return false;
	}
	try {
		return fs.existsSync(filePath);
	} catch (error) {
		return false;
	}
};

const buildDownloadFilename = (order, type) => {
	const config = FILE_TYPES[type];
	const safeNumber = (order.invoice_number || `orden-${order.id_shopping_car}`)
		.replace(/[^0-9A-Za-z-]/g, '');
	return `factura-${safeNumber}.${config.ext}`;
};

const resolveInvoiceFile = async ({ orderId, type, userId, isAdmin = false }) => {
	const config = FILE_TYPES[type];
	if (!config) {
		throw new Error('Tipo de archivo inválido');
	}

	const order = await knex('shopping_car')
		.where({ id_shopping_car: orderId })
		.first();

	if (!order) {
		throw new Error('Orden no encontrada');
	}

	if (!isAdmin && parseInt(order.id_user, 10) !== parseInt(userId, 10)) {
		throw new Error('No tienes permiso para acceder a esta factura');
	}

	if (parseInt(order.status_invoice, 10) !== 1) {
		throw new Error('La orden no tiene factura generada');
	}

	const filePath = order[config.column];
	if (!fileExists(filePath)) {
		throw new Error('Archivo de factura no disponible en el servidor');
	}

	return {
		filePath: path.resolve(filePath),
		mime: config.mime,
		filename: buildDownloadFilename(order, type),
	};
};

const streamInvoiceFile = (res, { filePath, mime, filename }) => {
	res.setHeader('Content-Type', mime);
	res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
	fs.createReadStream(filePath).pipe(res);
};

const getInvoiceAvailability = (order) => ({
	has_invoice_pdf: fileExists(order.invoice_pdf_path),
	has_invoice_xml: fileExists(order.invoice_xml_path),
	invoice_number: order.invoice_number || null,
	invoice_access_key: order.invoice_access_key || null,
	invoiced_at: order.invoiced_at || null,
});

const sanitizeOrderInvoiceFields = (order) => {
	const availability = getInvoiceAvailability(order);
	const {
		invoice_pdf_path,
		invoice_xml_path,
		invoice_error,
		...rest
	} = order;

	return {
		...rest,
		...availability,
	};
};

module.exports = {
	resolveInvoiceFile,
	streamInvoiceFile,
	getInvoiceAvailability,
	sanitizeOrderInvoiceFields,
	fileExists,
};
