exports.up = async function up(knex) {
	const hasBillingSettings = await knex.schema.hasTable('billing_settings');
	if (!hasBillingSettings) {
		await knex.schema.createTable('billing_settings', (t) => {
			t.increments('id_billing_settings').primary();
			t.string('environment', 20).notNullable().defaultTo('development');
			t.boolean('is_billing_enabled').notNullable().defaultTo(false);
			t.string('company_ruc', 20).nullable();
			t.string('company_legal_name', 255).nullable();
			t.string('company_trade_name', 255).nullable();
			t.string('company_address', 500).nullable();
			t.string('company_email', 255).nullable();
			t.string('establishment_code', 10).nullable().defaultTo('001');
			t.string('emission_point', 10).nullable().defaultTo('001');
			t.string('service_url', 500).nullable();
			t.string('output_path', 500).nullable();
			t.string('jasper_path', 500).nullable();
			t.string('signature_path', 500).nullable();
			t.string('signature_password', 255).nullable();
			t.timestamp('updated_at').defaultTo(knex.fn.now());
			t.integer('updated_by').unsigned().nullable();
		});

		await knex('billing_settings').insert({
			environment: 'development',
			is_billing_enabled: false,
			establishment_code: '001',
			emission_point: '001',
		});
	}

	const invoiceColumns = [
		{ name: 'invoice_access_key', type: (t) => t.string('invoice_access_key', 64).nullable() },
		{ name: 'invoice_pdf_path', type: (t) => t.string('invoice_pdf_path', 500).nullable() },
		{ name: 'invoice_xml_path', type: (t) => t.string('invoice_xml_path', 500).nullable() },
		{ name: 'invoice_number', type: (t) => t.string('invoice_number', 30).nullable() },
		{ name: 'invoice_error', type: (t) => t.text('invoice_error').nullable() },
		{ name: 'invoiced_at', type: (t) => t.timestamp('invoiced_at').nullable() },
	];

	for (const col of invoiceColumns) {
		const exists = await knex.schema.hasColumn('shopping_car', col.name);
		if (!exists) {
			await knex.schema.table('shopping_car', col.type);
		}
	}

	await knex('shopping_car')
		.whereNull('status_invoice')
		.update({ status_invoice: 0 });
};

exports.down = async function down(knex) {
	const dropCols = [
		'invoice_access_key',
		'invoice_pdf_path',
		'invoice_xml_path',
		'invoice_number',
		'invoice_error',
		'invoiced_at',
	];

	for (const col of dropCols) {
		const exists = await knex.schema.hasColumn('shopping_car', col);
		if (exists) {
			await knex.schema.table('shopping_car', (t) => {
				t.dropColumn(col);
			});
		}
	}

	await knex.schema.dropTableIfExists('billing_settings');
};
