const knex = require('../db/knex');
const generalConstants = require('../constants/constants');

const PAID_STATUS = 3;

const daysAgo = (days) => {
	const date = new Date();
	date.setDate(date.getDate() - days);
	date.setHours(0, 0, 0, 0);
	return date;
};

const getDashboardStats = async () => {
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);
	const thirtyDaysAgo = daysAgo(30);

	const ordersTodayResult = await knex('shopping_car')
		.where({ status: PAID_STATUS })
		.where('updated_at', '>=', todayStart)
		.count({ total: 'id_shopping_car' })
		.first();

	const revenueResult = await knex('shopping_car')
		.where({ status: PAID_STATUS })
		.sum({ total: 'shopping_car_total' })
		.first();

	const revenue30Result = await knex('shopping_car')
		.where({ status: PAID_STATUS })
		.where('updated_at', '>=', thirtyDaysAgo)
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

	const pendingInvoicesResult = await knex('shopping_car')
		.where({ status: PAID_STATUS })
		.where(function builder() {
			this.where('status_invoice', 0).orWhereNull('status_invoice');
		})
		.count({ total: 'id_shopping_car' })
		.first();

	const invoicedResult = await knex('shopping_car')
		.where({ status: PAID_STATUS, status_invoice: 1 })
		.count({ total: 'id_shopping_car' })
		.first();

	const invoiceErrorsResult = await knex('shopping_car')
		.where({ status: PAID_STATUS })
		.whereNotNull('invoice_error')
		.where(function builder() {
			this.where('status_invoice', 0).orWhereNull('status_invoice');
		})
		.count({ total: 'id_shopping_car' })
		.first();

	const recentOrders = await knex('shopping_car as sc')
		.join('users as u', 'u.id_users', 'sc.id_user')
		.select(
			'sc.id_shopping_car',
			'sc.shopping_car_total',
			'sc.status',
			'sc.status_invoice',
			'sc.updated_at',
			'u.name_user',
			'u.last_name_user',
			'u.email'
		)
		.where('sc.status', PAID_STATUS)
		.orderBy('sc.updated_at', 'desc')
		.limit(8);

	const topProducts = await knex('shopping_car_details as d')
		.join('shopping_car as sc', 'sc.id_shopping_car', 'd.id_shopping_car')
		.join('products as p', 'p.id_products', 'd.id_product')
		.where('sc.status', PAID_STATUS)
		.where('d.status', generalConstants.STATUS_ACTIVE)
		.where('sc.updated_at', '>=', thirtyDaysAgo)
		.groupBy('d.id_product', 'p.name', 'p.cod_products')
		.select(
			'd.id_product',
			'p.name',
			'p.cod_products',
			knex.raw('SUM(d.details_quantity) as units_sold'),
			knex.raw('SUM(d.details_total) as revenue')
		)
		.orderBy('units_sold', 'desc')
		.limit(8);

	const weeklyTrend = await knex('shopping_car')
		.where({ status: PAID_STATUS })
		.where('updated_at', '>=', daysAgo(56))
		.select(
			knex.raw('YEARWEEK(updated_at, 1) as week_key'),
			knex.raw('COUNT(id_shopping_car) as orders_count'),
			knex.raw('SUM(shopping_car_total) as revenue')
		)
		.groupBy('week_key')
		.orderBy('week_key', 'asc')
		.limit(8);

	const categorySales = await knex('shopping_car_details as d')
		.join('shopping_car as sc', 'sc.id_shopping_car', 'd.id_shopping_car')
		.join('products as p', 'p.id_products', 'd.id_product')
		.leftJoin('features as f', function joinFeatures() {
			this.on('f.id_products', 'p.id_products').andOn('f.status', knex.raw('?', [generalConstants.STATUS_ACTIVE]));
		})
		.leftJoin('category as cat', 'cat.id_category', 'f.id_category')
		.where('sc.status', PAID_STATUS)
		.where('d.status', generalConstants.STATUS_ACTIVE)
		.where('sc.updated_at', '>=', thirtyDaysAgo)
		.groupBy('cat.id_category', 'cat.name')
		.select(
			'cat.id_category',
			'cat.name as category_name',
			knex.raw('SUM(d.details_quantity) as units_sold'),
			knex.raw('SUM(d.details_total) as revenue')
		)
		.orderBy('revenue', 'desc')
		.limit(6);

	const restockSuggestions = topProducts.slice(0, 5).map((product, index) => ({
		id_product: product.id_product,
		name: product.name,
		cod_products: product.cod_products,
		units_sold: Number(product.units_sold || 0),
		revenue: parseFloat(product.revenue || 0),
		priority: index < 2 ? 'high' : 'medium',
		note: 'Alta rotación en los últimos 30 días — revisar inventario y reposición.',
	}));

	return {
		ordersToday: Number((ordersTodayResult && ordersTodayResult.total) || 0),
		revenue: parseFloat((revenueResult && revenueResult.total) || 0),
		revenue30Days: parseFloat((revenue30Result && revenue30Result.total) || 0),
		productsCount: Number((productsResult && productsResult.total) || 0),
		clientsCount: Number((clientsResult && clientsResult.total) || 0),
		pendingInvoices: Number((pendingInvoicesResult && pendingInvoicesResult.total) || 0),
		invoicedOrders: Number((invoicedResult && invoicedResult.total) || 0),
		invoiceErrors: Number((invoiceErrorsResult && invoiceErrorsResult.total) || 0),
		recentOrders,
		topProducts: topProducts.map((row) => ({
			id_product: row.id_product,
			name: row.name,
			cod_products: row.cod_products,
			units_sold: Number(row.units_sold || 0),
			revenue: parseFloat(row.revenue || 0),
		})),
		weeklyTrend: weeklyTrend.map((row) => ({
			week_key: String(row.week_key),
			orders_count: Number(row.orders_count || 0),
			revenue: parseFloat(row.revenue || 0),
		})),
		categorySales: categorySales.map((row) => ({
			id_category: row.id_category,
			category_name: row.category_name || 'Sin categoría',
			units_sold: Number(row.units_sold || 0),
			revenue: parseFloat(row.revenue || 0),
		})),
		restockSuggestions,
	};
};

module.exports = {
	getDashboardStats,
	PAID_STATUS,
};
