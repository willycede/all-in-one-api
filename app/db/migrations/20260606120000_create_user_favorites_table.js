
exports.up = async function up(knex) {
	const exists = await knex.schema.hasTable('user_favorites');
	if (exists) return;

	await knex.schema.createTable('user_favorites', (t) => {
		t.increments('id_favorite').primary();
		t.integer('id_user').notNull().comment('FK to users.id_users');
		t.integer('id_product').notNull().comment('FK to products.id_products');
		t.integer('status').notNull().defaultTo(1).comment('1=active, 2=inactive');
		t.timestamp('created_at').defaultTo(knex.fn.now());
		t.timestamp('updated_at').defaultTo(knex.fn.now());

		t.foreign('id_user').references('users.id_users');
		t.foreign('id_product').references('products.id_products');
		t.unique(['id_user', 'id_product'], 'uq_user_favorites_user_product');
		t.index(['id_user', 'status'], 'idx_user_favorites_user_status');
	});
};

exports.down = function down(knex) {
	return knex.schema.dropTableIfExists('user_favorites');
};
