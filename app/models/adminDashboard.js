const knex = require('../db/knex');
const generalConstants = require('../constants/constants');

const PAID_STATUS = 3;

const getDashboardStats = async () => {
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const ordersTodayResult = await knex('shopping_car')
		.where({ status: PAID_STATUS })
		.where('updated_at', '>=', todayStart)
		.count({ total: 'id_shopping_car' })
		.first();

	const revenueResult = await knex('shopping_car')
		.where({ status: PAID_STATUS })
		.sum({ total: 'shopping_car_total' })
		.first();

	const productsResult = await knex('products')
		.where({ status: generalConstants.STATUS_ACTIVE })
		.count({ total: 'id_products' })
		.first();

	const clientsResult = await knex('user_rol')
		.where({ id_rol: generalConstants.CLIENT_ROL })
		.count({ total: 'id_user_rol' })
		.first();

	const recentOrders = await knex('shopping_car as sc')
		.join('users as u', 'u.id_users', 'sc.id_user')
		.select(
			'sc.id_shopping_car',
			'sc.shopping_car_total',
			'sc.status',
			'sc.updated_at',
			'u.name_user',
			'u.last_name_user',
			'u.email'
		)
		.where('sc.status', PAID_STATUS)
		.orderBy('sc.updated_at', 'desc')
		.limit(8);

	return {
		ordersToday: Number((ordersTodayResult && ordersTodayResult.total) || 0),
		revenue: parseFloat((revenueResult && revenueResult.total) || 0),
		productsCount: Number((productsResult && productsResult.total) || 0),
		clientsCount: Number((clientsResult && clientsResult.total) || 0),
		recentOrders,
	};
};

module.exports = {
	getDashboardStats,
	PAID_STATUS,
};
