const db = require('../db/knex');
const path = require('path');

const runMigrations = async () => {
	const [batchNo, log] = await db.migrate.latest({
		directory: path.join(__dirname, '../db/migrations'),
	});

	if (log.length === 0) {
		console.log('Database migrations: already up to date');
	} else {
		console.log(`Database migrations applied (batch ${batchNo}):`, log.join(', '));
	}
};

const ensureUserFavoritesTable = async () => {
	const exists = await db.schema.hasTable('user_favorites');
	if (exists) {
		return;
	}

	console.warn('[migrations] user_favorites no existe — creando tabla...');

	await db.schema.createTable('user_favorites', (t) => {
		t.increments('id_favorite').primary();
		t.integer('id_user').notNull();
		t.integer('id_product').notNull();
		t.integer('status').notNull().defaultTo(1);
		t.timestamp('created_at').defaultTo(db.fn.now());
		t.timestamp('updated_at').defaultTo(db.fn.now());
		t.unique(['id_user', 'id_product'], 'uq_user_favorites_user_product');
		t.index(['id_user', 'status'], 'idx_user_favorites_user_status');
	});

	try {
		await db.schema.table('user_favorites', (t) => {
			t.foreign('id_user').references('users.id_users');
			t.foreign('id_product').references('products.id_products');
		});
	} catch (error) {
		console.warn('[migrations] FKs de user_favorites omitidas:', error.message);
	}

	console.log('[migrations] user_favorites creada correctamente');
};

const testDB = async () => {
	await runMigrations();
	await ensureUserFavoritesTable();
	await db.raw('SELECT 1');
	console.log('Database connected successfully');
};

module.exports = { testDB, runMigrations, ensureUserFavoritesTable };
