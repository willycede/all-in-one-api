const adminOrdersModel = require('../models/adminOrders');
const orderHistoriModel = require('../models/order_history');
const userModel = require('../models/user');
const { trySendOrderCancelledEmail } = require('../helpers/orderCancellationEmail');
const response = require('../config/response');

const listOrders = async (req, res) => {
	try {
		const { page, limit, search, status, invoiceStatus } = req.query;
		const result = await adminOrdersModel.getAdminOrdersPaginated({
			page,
			limit,
			search,
			status,
			invoiceStatus,
		});
		return response.success(req, res, result, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

const cancelOrder = async (req, res) => {
	try {
		const idShoppingCar = parseInt(req.params.id_shopping_car, 10);
		const orderRow = await require('../db/knex')('shopping_car')
			.where({ id_shopping_car: idShoppingCar })
			.first();

		if (!orderRow) {
			return response.error(req, res, { message: 'Orden no encontrada' }, 404);
		}

		const result = await orderHistoriModel.cancelOrderForUser(
			idShoppingCar,
			orderRow.id_user,
			1,
			10
		);

		const users = await userModel.getUserById({ id_users: orderRow.id_user });
		const user = users && users[0];
		if (user && user.email) {
			await trySendOrderCancelledEmail({ user, order: result.order, cancelledByAdmin: true });
		}

		return response.success(req, res, { cancelled: true, orderId: idShoppingCar }, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

module.exports = {
	listOrders,
	cancelOrder,
};
