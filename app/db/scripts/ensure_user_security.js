require('dotenv').config();
const db = require('../knex');

async function ensureUserSecurity() {
	const hasTwoFactor = await db.schema.hasColumn('users', 'two_factor_enabled');
	if (!hasTwoFactor) {
		await db.schema.table('users', (table) => {
			table.boolean('two_factor_enabled').notNullable().defaultTo(false);
			table.string('totp_secret', 512).nullable();
			table.string('two_factor_pending_secret', 512).nullable();
			table.text('two_factor_backup_codes').nullable();
			table.timestamp('two_factor_enabled_at').nullable();
		});
		console.log('[ensure_user_security] Columnas 2FA agregadas a users');
	}

	const hasPrefs = await db.schema.hasTable('user_preferences');
	if (!hasPrefs) {
		await db.schema.createTable('user_preferences', (table) => {
			table.increments('id_user_preferences').primary();
			table.integer('id_users').unsigned().notNullable().unique();
			table.string('locale', 10).notNullable().defaultTo('sp');
			table.string('currency', 10).notNullable().defaultTo('USD');
			table.boolean('use_delivery_on_orders').notNullable().defaultTo(false);
			table.text('default_delivery_address').nullable();
			table.string('default_delivery_recipient', 255).nullable();
			table.string('default_delivery_phone', 50).nullable();
			table.timestamps(true, true);
		});
		console.log('[ensure_user_security] Tabla user_preferences creada');
	}

	const hasDelivery = await db.schema.hasColumn('shopping_car', 'delivery_address');
	if (!hasDelivery) {
		await db.schema.table('shopping_car', (table) => {
			table.boolean('use_delivery_address').notNullable().defaultTo(false);
			table.text('delivery_address').nullable();
			table.string('delivery_recipient_name', 255).nullable();
			table.string('delivery_recipient_phone', 50).nullable();
		});
		console.log('[ensure_user_security] Columnas de entrega agregadas a shopping_car');
	}
}

ensureUserSecurity()
	.then(() => {
		console.log('[ensure_user_security] OK');
		process.exit(0);
	})
	.catch((error) => {
		console.error('[ensure_user_security] Error:', error.message);
		process.exit(1);
	});
