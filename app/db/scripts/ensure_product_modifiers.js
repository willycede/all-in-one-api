require('dotenv').config();
const db = require('../knex');
const generalConstants = require('../../constants/constants');

const ACCESSORIES_GENERAL_CATEGORY = 'Accesorios';
const SEAT_CATEGORY = {
	name: 'Asientos',
	description: 'Tapices y asientos para vehículos',
};

const SEAT_SUBCATEGORIES = ['Cuero', 'Eco cuero', 'Eco cuero standard'];
const SEAT_COMPANY_ID = 1;

const ensureProductModifiersTable = async () => {
	const hasTable = await db.schema.hasTable('product_modifiers');
	if (!hasTable) {
		await db.schema.createTable('product_modifiers', (t) => {
			t.increments('id_modifier').primary();
			t.integer('id_products').notNullable().index();
			t.string('type', 30).notNullable().defaultTo('color');
			t.string('name', 100).notNullable();
			t.decimal('price_delta', 12, 4).notNullable().defaultTo(0);
			t.integer('status').notNullable().defaultTo(generalConstants.STATUS_ACTIVE);
			t.timestamp('created_at').defaultTo(db.fn.now());
			t.timestamp('updated_at').defaultTo(db.fn.now());
		});
		console.log('[product_modifiers] Tabla product_modifiers creada');
	}
};

const ensureShoppingCarDetailColumns = async () => {
	const columns = [
		{ name: 'id_modifier', add: (t) => t.integer('id_modifier').nullable() },
		{ name: 'modifier_name', add: (t) => t.string('modifier_name', 100).nullable() },
		{ name: 'modifier_price', add: (t) => t.decimal('modifier_price', 12, 4).notNullable().defaultTo(0) },
		{ name: 'id_city', add: (t) => t.integer('id_city').nullable() },
	];

	for (let i = 0; i < columns.length; i += 1) {
		const column = columns[i];
		const hasColumn = await db.schema.hasColumn('shopping_car_details', column.name);
		if (!hasColumn) {
			await db.schema.table('shopping_car_details', column.add);
			console.log(`[product_modifiers] Columna shopping_car_details.${column.name} agregada`);
		}
	}
};

const ensureSeatCategories = async () => {
	const hasParentColumn = await db.schema.hasColumn('category', 'id_parent_category');
	if (!hasParentColumn) {
		throw new Error('Falta category.id_parent_category; ejecuta primero npm run migrate:prod');
	}

	const general = await db('general_categories')
		.where({ name: ACCESSORIES_GENERAL_CATEGORY })
		.first();
	if (!general) {
		throw new Error(`No existe la categoría general "${ACCESSORIES_GENERAL_CATEGORY}"`);
	}

	let seatCategory = await db('category')
		.where({
			id_general_category: general.idgeneral_categories,
			name: SEAT_CATEGORY.name,
		})
		.whereNull('id_parent_category')
		.first();
	if (!seatCategory) {
		const inserted = await db('category').insert({
			id_company: SEAT_COMPANY_ID,
			id_general_category: general.idgeneral_categories,
			id_parent_category: null,
			name: SEAT_CATEGORY.name,
			description: SEAT_CATEGORY.description,
			status: generalConstants.STATUS_ACTIVE,
			created_at: db.fn.now(),
		});
		seatCategory = await db('category')
			.where({ id_category: inserted[0] })
			.first();
		console.log(`[product_modifiers] Categoría "${SEAT_CATEGORY.name}" creada bajo Accesorios`);
	}

	for (let i = 0; i < SEAT_SUBCATEGORIES.length; i += 1) {
		const name = SEAT_SUBCATEGORIES[i];
		const exists = await db('category')
			.where({
				name,
				id_general_category: general.idgeneral_categories,
				id_parent_category: seatCategory.id_category,
			})
			.first();
		if (!exists) {
			await db('category').insert({
				id_company: SEAT_COMPANY_ID,
				id_general_category: general.idgeneral_categories,
				id_parent_category: seatCategory.id_category,
				name,
				description: `Asientos ${name}`,
				status: generalConstants.STATUS_ACTIVE,
				created_at: db.fn.now(),
			});
			console.log(`[product_modifiers] Subcategoría "${name}" creada`);
		}
	}
};

const ensureProductModifiers = async () => {
	await ensureProductModifiersTable();
	await ensureShoppingCarDetailColumns();
	await ensureSeatCategories();
};

ensureProductModifiers()
	.then(() => {
		console.log('[product_modifiers] Listo');
		process.exit(0);
	})
	.catch((error) => {
		console.error('[product_modifiers] Error:', error.message);
		process.exit(1);
	});
