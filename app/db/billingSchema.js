const knex = require('./knex');

const INVOICE_COLUMNS = [
	{ name: 'invoice_access_key', type: (t) => t.string('invoice_access_key', 64).nullable() },
	{ name: 'invoice_pdf_path', type: (t) => t.string('invoice_pdf_path', 500).nullable() },
	{ name: 'invoice_xml_path', type: (t) => t.string('invoice_xml_path', 500).nullable() },
	{ name: 'invoice_number', type: (t) => t.string('invoice_number', 30).nullable() },
	{ name: 'invoice_error', type: (t) => t.text('invoice_error').nullable() },
	{ name: 'invoiced_at', type: (t) => t.timestamp('invoiced_at').nullable() },
	{ name: 'invoice_alert_muted', type: (t) => t.boolean('invoice_alert_muted').notNullable().defaultTo(false) },
	{ name: 'invoice_alert_last_sent_at', type: (t) => t.timestamp('invoice_alert_last_sent_at').nullable() },
];

const ensureBillingSettingsTable = async (db) => {
	const hasTable = await db.schema.hasTable('billing_settings');
	if (!hasTable) {
		await db.schema.createTable('billing_settings', (t) => {
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
			t.string('signature_deploy_path', 500).nullable();
			t.string('signature_path', 500).nullable();
			t.string('signature_password', 255).nullable();
			t.timestamp('updated_at').defaultTo(db.fn.now());
			t.integer('updated_by').unsigned().nullable();
		});
		console.log('[billing] Tabla billing_settings creada');
	}

	const hasDeployPathColumn = await db.schema.hasColumn('billing_settings', 'signature_deploy_path');
	if (!hasDeployPathColumn) {
		await db.schema.table('billing_settings', (t) => {
			t.string('signature_deploy_path', 500).nullable();
		});
		console.log('[billing] Columna billing_settings.signature_deploy_path agregada');
	}

	const row = await db('billing_settings').where({ id_billing_settings: 1 }).first();
	if (!row) {
		await db('billing_settings').insert({
			id_billing_settings: 1,
			environment: 'development',
			is_billing_enabled: false,
			establishment_code: '001',
			emission_point: '001',
		});
		console.log('[billing] Fila billing_settings por defecto insertada');
	}
};

const ensureInvoiceDataTable = async (db) => {
	const hasTable = await db.schema.hasTable('invoice_data');
	if (!hasTable) {
		await db.schema.createTable('invoice_data', (t) => {
			t.increments('id_invoice_data').primary();
			t.integer('id_user').unsigned().notNullable();
			t.string('type_id', 1).notNullable();
			t.string('id_document', 20).notNullable();
			t.string('razon_social', 255).notNullable();
			t.string('razon_comercial', 255).nullable();
			t.string('address', 500).notNullable();
			t.string('mail', 255).notNullable();
			t.boolean('principal').notNullable().defaultTo(true);
			t.timestamp('created_at').defaultTo(db.fn.now());
			t.timestamp('updated_at').defaultTo(db.fn.now());
			t.index(['id_user', 'principal'], 'invoice_data_user_principal_idx');
		});
		console.log('[billing] Tabla invoice_data creada');
	}
};

const ensureShoppingCarInvoiceColumns = async (db) => {
	const hasShoppingCar = await db.schema.hasTable('shopping_car');
	if (!hasShoppingCar) {
		console.warn('[billing] shopping_car no existe — omitiendo columnas de factura');
		return;
	}

	for (const col of INVOICE_COLUMNS) {
		const exists = await db.schema.hasColumn('shopping_car', col.name);
		if (!exists) {
			await db.schema.table('shopping_car', col.type);
			console.log(`[billing] Columna shopping_car.${col.name} agregada`);
		}
	}

	const hasStatusInvoice = await db.schema.hasColumn('shopping_car', 'status_invoice');
	if (hasStatusInvoice) {
		await db('shopping_car')
			.whereNull('status_invoice')
			.update({ status_invoice: 0 });
	}
};

const ensureBillingSchema = async (db = knex) => {
	await ensureBillingSettingsTable(db);
	await ensureInvoiceDataTable(db);
	await ensureShoppingCarInvoiceColumns(db);
};

module.exports = {
	ensureBillingSchema,
	INVOICE_COLUMNS,
};
