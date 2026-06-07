require('dotenv').config();
const db = require('../knex');
const { seedDefaultCoupons } = require('../../models/coupons');

const ensureCoupons = async () => {
	const hasCoupons = await db.schema.hasTable('coupons');
	if (!hasCoupons) {
		await db.schema.createTable('coupons', (t) => {
			t.increments('id_coupon').primary();
			t.string('code', 50).notNullable().unique();
			t.string('description', 255).nullable();
			t.string('discount_type', 20).notNullable();
			t.decimal('discount_value', 12, 4).notNullable();
			t.decimal('min_purchase', 12, 4).defaultTo(0);
			t.integer('max_uses').nullable();
			t.integer('used_count').notNullable().defaultTo(0);
			t.timestamp('valid_from').nullable();
			t.timestamp('valid_until').nullable();
			t.integer('status').notNullable().defaultTo(1);
			t.timestamp('created_at').defaultTo(db.fn.now());
			t.timestamp('updated_at').defaultTo(db.fn.now());
		});
		console.log('[coupons] Tabla coupons creada');
	}

	const hasCouponCode = await db.schema.hasColumn('shopping_car', 'coupon_code');
	if (!hasCouponCode) {
		await db.schema.table('shopping_car', (t) => {
			t.string('coupon_code', 50).nullable();
			t.decimal('coupon_discount', 12, 6).defaultTo(0);
		});
		console.log('[coupons] Columnas coupon_code / coupon_discount agregadas a shopping_car');
	}

	await seedDefaultCoupons();
	console.log('[coupons] Cupones demo listos (ALLINONE10, BIENVENIDO25)');
};

ensureCoupons()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('ERROR:', error.message);
		process.exit(1);
	});
