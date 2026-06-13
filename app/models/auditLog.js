const knex = require('../db/knex');

const insertAuditLog = async ({
	eventType,
	actorIdUsers = null,
	targetIdUsers = null,
	actorEmail = null,
	targetEmail = null,
	summary,
	metadata = null,
	ipAddress = null,
	userAgent = null,
}) => {
	const payload = {
		event_type: eventType,
		actor_id_users: actorIdUsers,
		target_id_users: targetIdUsers,
		actor_email: actorEmail,
		target_email: targetEmail,
		summary: String(summary || '').slice(0, 500),
		metadata: metadata ? JSON.stringify(metadata) : null,
		ip_address: ipAddress,
		user_agent: userAgent ? String(userAgent).slice(0, 500) : null,
		created_at: knex.fn.now(),
	};

	const [id] = await knex('audit_logs').insert(payload);
	return id;
};

const listAuditLogs = async ({
	page = 1,
	limit = 25,
	eventType = '',
	targetUserId = null,
	search = '',
}) => {
	const safePage = Math.max(1, parseInt(page, 10) || 1);
	const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
	const offset = (safePage - 1) * safeLimit;

	let query = knex('audit_logs').select('*');

	if (eventType) {
		query = query.where('event_type', eventType);
	}

	if (targetUserId) {
		const id = parseInt(targetUserId, 10);
		if (!Number.isNaN(id)) {
			query = query.where((qb) => {
				qb.where('target_id_users', id).orWhere('actor_id_users', id);
			});
		}
	}

	if (search) {
		const term = `%${String(search).trim()}%`;
		query = query.where((qb) => {
			qb.where('summary', 'like', term)
				.orWhere('actor_email', 'like', term)
				.orWhere('target_email', 'like', term)
				.orWhere('event_type', 'like', term);
		});
	}

	const countRow = await query.clone().clearSelect().count({ total: 'id_audit_log' }).first();
	const total = parseInt(countRow && countRow.total, 10) || 0;

	const rows = await query
		.orderBy('created_at', 'desc')
		.limit(safeLimit)
		.offset(offset);

	const items = rows.map((row) => {
		let metadata = null;
		if (row.metadata) {
			try {
				metadata = JSON.parse(row.metadata);
			} catch (error) {
				metadata = { raw: row.metadata };
			}
		}

		return {
			id: row.id_audit_log,
			eventType: row.event_type,
			actorId: row.actor_id_users,
			targetId: row.target_id_users,
			actorEmail: row.actor_email,
			targetEmail: row.target_email,
			summary: row.summary,
			metadata,
			ipAddress: row.ip_address,
			userAgent: row.user_agent,
			createdAt: row.created_at,
		};
	});

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

const listEventTypes = async () => {
	const rows = await knex('audit_logs')
		.distinct('event_type')
		.orderBy('event_type', 'asc');
	return rows.map((row) => row.event_type);
};

module.exports = {
	insertAuditLog,
	listAuditLogs,
	listEventTypes,
};
