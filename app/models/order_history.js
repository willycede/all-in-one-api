const knex = require('../db/knex');
const ORDER_STATUS = require('../constants/orderStatus');
const { sanitizeOrderInvoiceFields } = require('../helpers/invoiceFiles');

const DEFAULT_LIMIT = 10;
const ALLOWED_LIMITS = [10, 20, 50];

const normalizePagination = (page, limit) => {
	const safePage = Math.max(1, parseInt(page, 10) || 1);
	const parsedLimit = parseInt(limit, 10);
	const safeLimit = ALLOWED_LIMITS.includes(parsedLimit) ? parsedLimit : DEFAULT_LIMIT;
	return { page: safePage, limit: safeLimit };
};

const getOrderHistoryPaginated = async (id_user, page = 1, limit = DEFAULT_LIMIT) => {
	const { page: safePage, limit: safeLimit } = normalizePagination(page, limit);
	const offset = (safePage - 1) * safeLimit;

	const countResult = await knex('shopping_car')
		.where({ id_user })
		.count({ total: 'id_shopping_car' })
		.first();

	const total = Number((countResult && countResult.total) || 0);
	const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

	const items = await knex
		.select()
		.from('shopping_car')
		.where({ id_user })
		.orderBy('id_shopping_car', 'desc')
		.limit(safeLimit)
		.offset(offset);

	return {
		items: items.map(sanitizeOrderInvoiceFields),
		pagination: {
			page: safePage,
			limit: safeLimit,
			total,
			totalPages,
			hasNextPage: safePage < totalPages,
			hasPrevPage: safePage > 1,
		},
	};
};

const cancelOrderForUser = async (id_shopping_car, id_user, page, limit, trx) => {
	const db = trx || knex;
	const order = await db('shopping_car')
		.where({ id_shopping_car, id_user })
		.first();

	if (!order) {
		throw new Error('Orden no encontrada');
	}

	const status = parseInt(order.status, 10);

	if (status === ORDER_STATUS.CANCELLED) {
		throw new Error('La orden ya está cancelada');
	}

	if (status === ORDER_STATUS.PAID) {
		throw new Error('No se puede cancelar una orden ya pagada');
	}

	if (status !== ORDER_STATUS.PENDING_PAYMENT) {
		throw new Error('Solo puedes cancelar pedidos pendientes de pago');
	}

	await db('shopping_car')
		.where({ id_shopping_car })
		.update({
			status: ORDER_STATUS.CANCELLED,
			url_payphone: null,
			updated_at: knex.fn.now(),
		});

	const paginated = await getOrderHistoryPaginated(id_user, page, limit);

	return {
		order,
		paginated,
	};
};

const deleteOrderHistoryModel = cancelOrderForUser;

module.exports = {
	getOrderHistoryPaginated,
	cancelOrderForUser,
	deleteOrderHistoryModel,
	DEFAULT_LIMIT,
	ALLOWED_LIMITS,
};
