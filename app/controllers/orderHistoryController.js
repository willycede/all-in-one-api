const orderHistoriModel = require('../models/order_history');
const orderInvoiceModel = require('../models/order_invoice');
const response = require('../config/response');

const getOrdersHistory = async (req, res) => {
	try {
		const id_user = parseInt(req.params.id_user, 10);
		const { page, limit } = req.query;
		const order = await orderHistoriModel.getOrderHistoryPaginated(id_user, page, limit);
		return response.success(req, res, order, 200);
	} catch (error) {
		return response.error(req, res, { message: `getOrderHistory: ${error.message}` }, 422);
	}
};

const deleteHistory = async (req, res) => {
	try {
		const id_shopping_car = parseInt(req.params.id_shopping_car, 10);
		const id_user = parseInt(req.params.id_user, 10);
		const { page, limit } = req.query;

		const order = await orderHistoriModel.deleteOrderHistoryModel(
			id_shopping_car,
			id_user,
			page,
			limit
		);
		return response.success(req, res, order, 200);
	} catch (error) {
		return response.error(req, res, { message: `deleteOrderHistoryModel: ${error.message}` }, 422);
	}
};

const reprocessInvoice = async (req, res) => {
	try {
		const id_shopping_car = parseInt(req.params.id_shopping_car, 10);
		const id_user = parseInt(req.params.id_user, 10);
		const { page, limit } = req.query;

		const order = await orderInvoiceModel.reprocessOrderInvoice(
			id_shopping_car,
			id_user,
			page,
			limit
		);
		return response.success(req, res, order, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

module.exports = {
	getOrdersHistory,
	deleteHistory,
	reprocessInvoice,
};
