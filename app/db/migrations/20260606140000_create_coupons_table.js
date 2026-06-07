
exports.up = async function up(knex) {
	const hasCoupons = await knex.schema.hasTable('coupons');
	if (!hasCoupons) {
		await knex.schema.createTable('coupons', (t) => {
			t.increments('id_coupon').primary();
			t.string('code', 50).notNullable().unique();
			t.string('description', 255).nullable();
			t.string('discount_type', 20).notNullable().comment('percent | fixed');
			t.decimal('discount_value', 12, 4).notNullable();
			t.decimal('min_purchase', 12, 4).defaultTo(0);
			t.integer('max_uses').nullable();
			t.integer('used_count').notNullable().defaultTo(0);
			t.timestamp('valid_from').nullable();
			t.timestamp('valid_until').nullable();
			t.integer('status').notNullable().defaultTo(1);
			t.timestamp('created_at').defaultTo(knex.fn.now());
			t.timestamp('updated_at').defaultTo(knex.fn.now());
		});
	}

	const hasCouponCode = await knex.schema.hasColumn('shopping_car', 'coupon_code');
	if (!hasCouponCode) {
		await knex.schema.table('shopping_car', (t) => {
			t.string('coupon_code', 50).nullable();
			t.decimal('coupon_discount', 12, 6).defaultTo(0);
		});
	}
};

exports.down = async function down(knex) {
	const hasCouponCode = await knex.schema.hasColumn('shopping_car', 'coupon_code');
	if (hasCouponCode) {
		await knex.schema.table('shopping_car', (t) => {
			t.dropColumn('coupon_code');
			t.dropColumn('coupon_discount');
		});
	}
	await knex.schema.dropTableIfExists('coupons');
};
