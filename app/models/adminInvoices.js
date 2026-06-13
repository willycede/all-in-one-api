const knex = require('../db/knex');
const { reprocessInvoiceForOrder } = require('./order_invoice');
const { getInvoiceAvailability } = require('../helpers/invoiceFiles');

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
	} else if (filters.status === 'error') {
		query = query
			.where('sc.status_invoice', 0)
			.whereNotNull('sc.invoice_error')
			.where('sc.invoice_error', '!=', '');
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
			'sc.invoice_number',
			'sc.invoice_access_key',
			'sc.invoice_error',
			'sc.invoice_pdf_path',
			'sc.invoice_xml_path',
			'sc.invoiced_at',
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

	const sanitizedItems = items.map((row) => {
		const availability = getInvoiceAvailability(row);
		return {
			id_shopping_car: row.id_shopping_car,
			id_user: row.id_user,
			shopping_car_total: row.shopping_car_total,
			shopping_car_subtotal: row.shopping_car_subtotal,
			shopping_car_iva: row.shopping_car_iva,
			status: row.status,
			status_invoice: row.status_invoice,
			invoice_number: row.invoice_number,
			invoice_error: row.invoice_error,
			created_at: row.created_at,
			updated_at: row.updated_at,
			name_user: row.name_user,
			last_name_user: row.last_name_user,
			email: row.email,
			identification_number: row.identification_number,
			...availability,
		};
	});

	return {
		items: sanitizedItems,
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

	const result = await reprocessInvoiceForOrder(id);

	if (!result.success) {
		throw new Error(result.message || result.invoice_error || 'No se pudo reprocesar la factura');
	}

	return result;
};

module.exports = {
	getAdminInvoicesPaginated,
	reprocessAdminInvoice,
	DEFAULT_LIMIT,
	ALLOWED_LIMITS,
};
