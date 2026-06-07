const knex = require('../db/knex');
const { reprocessInvoiceForOrder } = require('./order_invoice');

const PAID_STATUS = 3;
const DEFAULT_LIMIT = 10;
const ALLOWED_LIMITS = [10, 20, 50];

const normalizePagination = (page, limit) => {
	const safePage = Math.max(1, parseInt(page, 10) || 1);
	const parsedLimit = parseInt(limit, 10);
	const safeLimit = ALLOWED_LIMITS.includes(parsedLimit) ? parsedLimit : DEFAULT_LIMIT;
	return { page: safePage, limit: safeLimit };
};

const buildInvoicesQuery = (filters) => {
	let query = knex('shopping_car as sc')
		.join('users as u', 'u.id_users', 'sc.id_user')
		.where('sc.status', PAID_STATUS);

	if (filters.status === 'pending') {
		query = query.where('sc.status_invoice', 0);
	} else if (filters.status === 'invoiced') {
		query = query.where('sc.status_invoice', 1);
	}

	if (filters.search && String(filters.search).trim()) {
		const raw = String(filters.search).trim();
		const numericId = parseInt(raw, 10);
		query = query.where(function searchScope() {
			this.where('u.email', 'like', `%${raw}%`)
				.orWhere('u.name_user', 'like', `%${raw}%`)
				.orWhere('u.last_name_user', 'like', `%${raw}%`)
				.orWhere('u.identification_number', 'like', `%${raw}%`);
			if (!Number.isNaN(numericId)) {
				this.orWhere('sc.id_shopping_car', numericId);
			}
		});
	}

	return query;
};

const getAdminInvoicesPaginated = async ({ page, limit, search, status }) => {
	const { page: safePage, limit: safeLimit } = normalizePagination(page, limit);
	const offset = (safePage - 1) * safeLimit;
	const filters = {
		search,
		status: status || 'all',
	};

	const countResult = await buildInvoicesQuery(filters)
		.clone()
		.count({ total: 'sc.id_shopping_car' })
		.first();

	const total = Number((countResult && countResult.total) || 0);
	const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

	const items = await buildInvoicesQuery(filters)
		.clone()
		.select(
			'sc.id_shopping_car',
			'sc.id_user',
			'sc.shopping_car_total',
			'sc.shopping_car_subtotal',
			'sc.shopping_car_iva',
			'sc.status',
			'sc.status_invoice',
			'sc.created_at',
			'sc.updated_at',
			'u.name_user',
			'u.last_name_user',
			'u.email',
			'u.identification_number'
		)
		.orderBy('sc.updated_at', 'desc')
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
		filters,
	};
};

const reprocessAdminInvoice = async (idShoppingCar) => {
	const id = parseInt(idShoppingCar, 10);
	if (!id) {
		throw new Error('ID de orden inválido');
	}
	return reprocessInvoiceForOrder(id);
};

module.exports = {
	getAdminInvoicesPaginated,
	reprocessAdminInvoice,
	DEFAULT_LIMIT,
	ALLOWED_LIMITS,
};
