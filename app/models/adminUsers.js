const knex = require('../db/knex');
const constants = require('../constants/constants');

const listUsersForAdmin = async ({
	page = 1,
	limit = 20,
	search = '',
	twoFactorFilter = 'all',
}) => {
	const safePage = Math.max(1, parseInt(page, 10) || 1);
	const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
	const offset = (safePage - 1) * safeLimit;

	let query = knex('users')
		.select(
			'users.id_users',
			'users.name_user',
			'users.last_name_user',
			'users.email',
			'users.status',
			'users.two_factor_enabled',
			'users.two_factor_enabled_at',
			'users.created_at',
			knex.raw('(users.two_factor_pending_secret IS NOT NULL) as two_factor_pending')
		);

	if (search) {
		const term = `%${String(search).trim()}%`;
		query = query.where((qb) => {
			qb.where('users.email', 'like', term)
				.orWhere('users.name_user', 'like', term)
				.orWhere('users.last_name_user', 'like', term)
				.orWhere('users.identification_number', 'like', term);
		});
	}

	if (twoFactorFilter === 'enabled') {
		query = query.where('users.two_factor_enabled', true);
	}
	if (twoFactorFilter === 'disabled') {
		query = query.where('users.two_factor_enabled', false)
			.whereNull('users.two_factor_pending_secret');
	}
	if (twoFactorFilter === 'pending') {
		query = query.whereNotNull('users.two_factor_pending_secret');
	}

	const countRow = await query.clone().clearSelect().count({ total: 'users.id_users' }).first();
	const total = parseInt(countRow && countRow.total, 10) || 0;

	const rows = await query
		.orderBy('users.id_users', 'desc')
		.limit(safeLimit)
		.offset(offset);

	const items = rows.map((row) => ({
		id: row.id_users,
		firstName: row.name_user,
		lastName: row.last_name_user,
		fullName: [row.name_user, row.last_name_user].filter(Boolean).join(' ').trim(),
		email: row.email,
		status: row.status,
		isActive: row.status === constants.STATUS_ACTIVE,
		twoFactorEnabled: !!row.two_factor_enabled,
		twoFactorPending: !!row.two_factor_pending,
		twoFactorEnabledAt: row.two_factor_enabled_at,
		createdAt: row.created_at,
	}));

	const totalPages = Math.max(1, Math.ceil(total / safeLimit));

	return {
		items,
		pagination: {
			page: safePage,
			limit: safeLimit,
			total,
			totalPages,
			hasPrevPage: safePage > 1,
			hasNextPage: safePage < totalPages,
		},
	};
};

const getAdminUserById = async (idUsers) => knex('users')
	.select(
		'id_users',
		'name_user',
		'last_name_user',
		'email',
		'status',
		'two_factor_enabled',
		'two_factor_pending_secret',
		'two_factor_backup_codes',
		'two_factor_enabled_at'
	)
	.where({ id_users: idUsers })
	.first();

const updateUserStatus = async (idUsers, status) => knex('users')
	.where({ id_users: idUsers })
	.update({
		status,
		updated_at: knex.fn.now(),
	});

module.exports = {
	listUsersForAdmin,
	getAdminUserById,
	updateUserStatus,
};
