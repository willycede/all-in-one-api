const knex = require('../db/knex');

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
		items,
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

const deleteOrderHistoryModel = async (id_shopping_car, id_user, page, limit, trx) => {
	await (trx || knex)('shopping_car')
		.where('id_shopping_car', '=', id_shopping_car)
		.update({ status: 4 });

	return getOrderHistoryPaginated(id_user, page, limit);
};

module.exports = {
	getOrderHistoryPaginated,
	deleteOrderHistoryModel,
	DEFAULT_LIMIT,
	ALLOWED_LIMITS,
};
