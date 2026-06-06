/**
 * Marca migraciones históricas como aplicadas en knex_migrations.
 * Usar en BD que ya existía antes de Knex (evita "Table already exists" en migrate:latest).
 *
 * Uso: npm run migrate:baseline
 * Luego: npm run migrate   (solo aplicará migraciones nuevas pendientes)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../knex');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');
const SKIP = new Set([
	'20260606120000_create_user_favorites_table.js',
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
	const pending = files.filter((file) => !applied.has(file) && !SKIP.has(file));

	if (pending.length === 0) {
		console.log('Baseline: no hay migraciones históricas pendientes de marcar.');
		return;
	}

	const batchRow = await db('knex_migrations').max('batch as maxBatch').first();
	const batch = ((batchRow && batchRow.maxBatch) || 0) + 1;
	const now = new Date();

	await db('knex_migrations').insert(
		pending.map((name) => ({
			name,
			batch,
			migration_time: now,
		}))
	);

	console.log(`Baseline: ${pending.length} migraciones marcadas como aplicadas (batch ${batch}).`);
	console.log('Pendientes reales para migrate:latest:', [...SKIP].filter((f) => !applied.has(f)).join(', ') || '(ninguna)');
}

baseline()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Baseline ERROR:', error.message);
		process.exit(1);
	});
