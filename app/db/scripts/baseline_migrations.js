/**
 * Marca migraciones históricas como aplicadas en knex_migrations.
 * Usar en BD que ya existía antes de Knex (evita "Table already exists" en migrate:latest).
 *
 * Uso en servidor con BD ya poblada:
 *   npm run migrate:baseline
 *   npm run migrate:prod
 *
 * O solo la tabla de auditoría:
 *   npm run migrate:baseline
 *   npm run migrate:audit-logs
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../knex');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

// No marcar como aplicadas: migrate:latest las ejecutará (son idempotentes o nuevas).
const RUN_ON_MIGRATE = new Set([
	'20260606120000_create_user_favorites_table.js',
	'20260606140000_create_coupons_table.js',
	'20260607120000_user_security_preferences_delivery.js',
	'20260608120000_billing_settings_and_invoice_metadata.js',
	'20260609120000_create_audit_logs_table.js',
	'20260613120000_add_signature_deploy_path_to_billing_settings.js',
]);

async function ensureKnexMetaTables() {
	const hasMigrations = await db.schema.hasTable('knex_migrations');
	if (!hasMigrations) {
		await db.schema.createTable('knex_migrations', (t) => {
			t.increments('id').primary();
			t.string('name', 255);
			t.integer('batch');
			t.timestamp('migration_time');
		});
	}

	const hasLock = await db.schema.hasTable('knex_migrations_lock');
	if (!hasLock) {
		await db.schema.createTable('knex_migrations_lock', (t) => {
			t.increments('index').primary();
			t.integer('is_locked');
		});
		await db('knex_migrations_lock').insert({ is_locked: 0 });
	}
}

async function baseline() {
	await ensureKnexMetaTables();

	const files = fs.readdirSync(MIGRATIONS_DIR)
		.filter((file) => file.endsWith('.js'))
		.sort();

	const applied = new Set(await db('knex_migrations').pluck('name'));
	const toBaseline = files.filter((file) => !applied.has(file) && !RUN_ON_MIGRATE.has(file));

	if (toBaseline.length === 0) {
		console.log('[baseline] No hay migraciones históricas pendientes de marcar.');
	} else {
		const batchRow = await db('knex_migrations').max('batch as maxBatch').first();
		const batch = ((batchRow && batchRow.maxBatch) || 0) + 1;
		const now = new Date();

		await db('knex_migrations').insert(
			toBaseline.map((name) => ({
				name,
				batch,
				migration_time: now,
			}))
		);

		console.log(`[baseline] ${toBaseline.length} migraciones marcadas como aplicadas (batch ${batch}).`);
	}

	const pendingMigrate = files.filter((file) => !applied.has(file) && RUN_ON_MIGRATE.has(file));
	if (pendingMigrate.length) {
		console.log('[baseline] Pendientes para migrate:latest:');
		pendingMigrate.forEach((name) => console.log(`  - ${name}`));
		console.log('Ejecuta: npm run migrate  o  npm run migrate:prod');
	} else {
		console.log('[baseline] No quedan migraciones pendientes en RUN_ON_MIGRATE.');
	}
}

baseline()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('[baseline] ERROR:', error.message);
		process.exit(1);
	});
