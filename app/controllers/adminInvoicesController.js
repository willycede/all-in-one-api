const adminInvoicesModel = require('../models/adminInvoices');
const response = require('../config/response');
const { resolveInvoiceFile, streamInvoiceFile } = require('../helpers/invoiceFiles');

const listInvoices = async (req, res) => {
	try {
		const { page, limit, search, status } = req.query;
		const result = await adminInvoicesModel.getAdminInvoicesPaginated({
			page,
			limit,
			search,
			status,
		});
		return response.success(req, res, result, 200);
	} catch (error) {
		return response.error(req, res, { message: `listInvoices: ${error.message}` }, 422);
	}
};

const reprocessInvoice = async (req, res) => {
	try {
		const idShoppingCar = parseInt(req.params.id_shopping_car, 10);
		const updated = await adminInvoicesModel.reprocessAdminInvoice(idShoppingCar);
		return response.success(req, res, updated, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

const downloadInvoiceFile = async (req, res) => {
	try {
		const orderId = parseInt(req.params.id_shopping_car, 10);
		const type = String(req.params.type || '').toLowerCase();

		const file = await resolveInvoiceFile({
			orderId,
			type,
			isAdmin: true,
		});

		streamInvoiceFile(res, file);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 404);
	}
};

module.exports = {
	listInvoices,
	reprocessInvoice,
	downloadInvoiceFile,
};
