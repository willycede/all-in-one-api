const knex = require('../db/knex');
const ORDER_STATUS = require('../constants/orderStatus');
const { getInvoiceAvailability } = require('../helpers/invoiceFiles');

const DEFAULT_LIMIT = 10;
const ALLOWED_LIMITS = [10, 20, 50];

const ORDER_STATUS_LABELS = {
	[ORDER_STATUS.ACTIVE_CART]: 'Carrito',
	[ORDER_STATUS.PENDING_PAYMENT]: 'En pago',
	[ORDER_STATUS.PAID]: 'Pagado',
	[ORDER_STATUS.CANCELLED]: 'Cancelado',
};

const normalizePagination = (page, limit) => {
	const safePage = Math.max(1, parseInt(page, 10) || 1);
	const parsedLimit = parseInt(limit, 10);
	const safeLimit = ALLOWED_LIMITS.includes(parsedLimit) ? parsedLimit : DEFAULT_LIMIT;
	return { page: safePage, limit: safeLimit };
};

const buildOrdersQuery = (filters) => {
	let query = knex('shopping_car as sc')
		.join('users as u', 'u.id_users', 'sc.id_user')
		.whereNot('sc.status', ORDER_STATUS.ACTIVE_CART);

	if (filters.status && filters.status !== 'all') {
		const statusMap = {
			pending_payment: ORDER_STATUS.PENDING_PAYMENT,
			paid: ORDER_STATUS.PAID,
			cancelled: ORDER_STATUS.CANCELLED,
		};
		if (statusMap[filters.status] != null) {
			query = query.where('sc.status', statusMap[filters.status]);
		}
	}

	if (filters.invoiceStatus === 'pending') {
		query = query.where('sc.status_invoice', 0);
	} else if (filters.invoiceStatus === 'invoiced') {
		query = query.where('sc.status_invoice', 1);
	}

	if (filters.search && String(filters.search).trim()) {
		const raw = String(filters.search).trim();
		const numericId = parseInt(raw, 10);
		query = query.where(function searchScope() {
			this.where('u.email', 'like', `%${raw}%`)
				.orWhere('u.name_user', 'like', `%${raw}%`)
				.orWhere('u.last_name_user', 'like', `%${raw}%`)
				.orWhere('u.identification_number', 'like', `%${raw}%`)
				.orWhere('sc.delivery_recipient_name', 'like', `%${raw}%`);
			if (!Number.isNaN(numericId)) {
				this.orWhere('sc.id_shopping_car', numericId);
			}
		});
	}

	return query;
};

const getAdminOrdersPaginated = async ({ page, limit, search, status, invoiceStatus }) => {
	const { page: safePage, limit: safeLimit } = normalizePagination(page, limit);
	const offset = (safePage - 1) * safeLimit;
	const filters = {
		search,
		status: status || 'all',
		invoiceStatus: invoiceStatus || 'all',
	};

	const countResult = await buildOrdersQuery(filters)
		.clone()
		.count({ total: 'sc.id_shopping_car' })
		.first();

	const total = Number((countResult && countResult.total) || 0);
	const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

	const items = await buildOrdersQuery(filters)
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
			'sc.invoice_pdf_path',
			'sc.invoice_xml_path',
			'sc.invoiced_at',
			'sc.created_at',
			'sc.updated_at',
			'sc.use_delivery_address',
			'sc.delivery_address',
			'sc.delivery_recipient_name',
			'sc.delivery_recipient_phone',
			'u.name_user',
			'u.last_name_user',
			'u.email',
			'u.identification_number',
			'u.address as customer_address'
		)
		.orderBy('sc.id_shopping_car', 'desc')
		.limit(safeLimit)
		.offset(offset);

	return {
		items: items.map((item) => {
			const availability = getInvoiceAvailability(item);
			return {
				id_shopping_car: item.id_shopping_car,
				id_user: item.id_user,
				shopping_car_total: item.shopping_car_total,
				shopping_car_subtotal: item.shopping_car_subtotal,
				shopping_car_iva: item.shopping_car_iva,
				status: item.status,
				status_invoice: item.status_invoice,
				created_at: item.created_at,
				updated_at: item.updated_at,
				use_delivery_address: item.use_delivery_address,
				delivery_address: item.delivery_address,
				delivery_recipient_name: item.delivery_recipient_name,
				delivery_recipient_phone: item.delivery_recipient_phone,
				name_user: item.name_user,
				last_name_user: item.last_name_user,
				email: item.email,
				identification_number: item.identification_number,
				customer_address: item.customer_address,
				statusLabel: ORDER_STATUS_LABELS[parseInt(item.status, 10)] || 'Desconocido',
				...availability,
			};
		}),
		pagination: {
			page: safePage,
			limit: safeLimit,
			total,
			totalPages,
			hasNextPage: safePage < totalPages,
			hasPrevPage: safePage > 1,
		},
		filters,
		statusLabels: ORDER_STATUS_LABELS,
	};
};

module.exports = {
	getAdminOrdersPaginated,
	ORDER_STATUS_LABELS,
};
