require('dotenv').config();
const db = require('../knex');

async function ensureAuditLogs() {
	const exists = await db.schema.hasTable('audit_logs');
	if (!exists) {
		await db.schema.createTable('audit_logs', (table) => {
			table.increments('id_audit_log').unsigned().primary();
			table.string('event_type', 80).notNullable().index();
			table.integer('actor_id_users').unsigned().nullable().index();
			table.integer('target_id_users').unsigned().nullable().index();
			table.string('actor_email', 200).nullable();
			table.string('target_email', 200).nullable();
			table.string('summary', 500).notNullable();
			table.text('metadata').nullable();
			table.string('ip_address', 45).nullable();
			table.string('user_agent', 500).nullable();
			table.timestamp('created_at').defaultTo(db.fn.now()).index();
		});
		console.log('[ensure_audit_logs] Tabla audit_logs creada');
	} else {
		console.log('[ensure_audit_logs] Tabla audit_logs ya existe');
	}
}

ensureAuditLogs()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('[ensure_audit_logs] ERROR:', error.message);
		process.exit(1);
	});
