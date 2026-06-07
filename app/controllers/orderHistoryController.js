const orderHistoriModel = require('../models/order_history');
const orderInvoiceModel = require('../models/order_invoice');
const orderRepeatModel = require('../models/order_repeat');
const userModel = require('../models/user');
const { trySendOrderCancelledEmail } = require('../helpers/orderCancellationEmail');
const { resolveInvoiceFile, streamInvoiceFile } = require('../helpers/invoiceFiles');
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

		const result = await orderHistoriModel.cancelOrderForUser(
			id_shopping_car,
			id_user,
			page,
			limit
		);

		const users = await userModel.getUserById({ id_users: id_user });
		const user = users && users[0];

		if (user && user.email) {
			await trySendOrderCancelledEmail({ user, order: result.order });
		}

		return response.success(req, res, result.paginated, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
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

const repeatOrder = async (req, res) => {
	try {
		const id_shopping_car = parseInt(req.params.id_shopping_car, 10);
		const id_user = parseInt(req.params.id_user, 10);

		const result = await orderRepeatModel.repeatOrderForUser(id_shopping_car, id_user);
		return response.success(req, res, result, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

const downloadInvoiceFile = async (req, res) => {
	try {
		const orderId = parseInt(req.params.id_shopping_car, 10);
		const userId = parseInt(req.params.id_user, 10);
		const type = String(req.params.type || '').toLowerCase();

		const file = await resolveInvoiceFile({
			orderId,
			type,
			userId,
			isAdmin: false,
		});

		streamInvoiceFile(res, file);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 404);
	}
};

module.exports = {
	getOrdersHistory,
	deleteHistory,
	reprocessInvoice,
	repeatOrder,
	downloadInvoiceFile,
};
