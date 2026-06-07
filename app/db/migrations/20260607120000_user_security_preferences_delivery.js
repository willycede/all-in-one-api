exports.up = async function up(knex) {
	const hasTwoFactor = await knex.schema.hasColumn('users', 'two_factor_enabled');
	if (!hasTwoFactor) {
		await knex.schema.table('users', (table) => {
			table.boolean('two_factor_enabled').notNullable().defaultTo(false);
			table.string('totp_secret', 512).nullable();
			table.string('two_factor_pending_secret', 512).nullable();
			table.text('two_factor_backup_codes').nullable();
			table.timestamp('two_factor_enabled_at').nullable();
		});
	}

	const hasPrefs = await knex.schema.hasTable('user_preferences');
	if (!hasPrefs) {
		await knex.schema.createTable('user_preferences', (table) => {
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
	}

	const hasDelivery = await knex.schema.hasColumn('shopping_car', 'delivery_address');
	if (!hasDelivery) {
		await knex.schema.table('shopping_car', (table) => {
			table.boolean('use_delivery_address').notNullable().defaultTo(false);
			table.text('delivery_address').nullable();
			table.string('delivery_recipient_name', 255).nullable();
			table.string('delivery_recipient_phone', 50).nullable();
		});
	}
};

exports.down = async function down(knex) {
	const hasDelivery = await knex.schema.hasColumn('shopping_car', 'delivery_address');
	if (hasDelivery) {
		await knex.schema.table('shopping_car', (table) => {
			table.dropColumn('use_delivery_address');
			table.dropColumn('delivery_address');
			table.dropColumn('delivery_recipient_name');
			table.dropColumn('delivery_recipient_phone');
		});
	}

	if (await knex.schema.hasTable('user_preferences')) {
		await knex.schema.dropTable('user_preferences');
	}

	const hasTwoFactor = await knex.schema.hasColumn('users', 'two_factor_enabled');
	if (hasTwoFactor) {
		await knex.schema.table('users', (table) => {
			table.dropColumn('two_factor_enabled');
			table.dropColumn('totp_secret');
			table.dropColumn('two_factor_pending_secret');
			table.dropColumn('two_factor_backup_codes');
			table.dropColumn('two_factor_enabled_at');
		});
	}
};
