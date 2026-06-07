require('dotenv').config();
const knex = require('../db/knex');

async function ensureBillingSettings() {
	const hasTable = await knex.schema.hasTable('billing_settings');
	if (!hasTable) {
		console.log('Ejecuta knex migrate:latest para crear billing_settings');
		process.exit(1);
	}

	const row = await knex('billing_settings').where({ id_billing_settings: 1 }).first();
	if (!row) {
		await knex('billing_settings').insert({
			id_billing_settings: 1,
			environment: 'development',
			is_billing_enabled: false,
			establishment_code: '001',
			emission_point: '001',
		});
	}

	await knex('shopping_car')
		.whereNull('status_invoice')
		.update({ status_invoice: 0 });

	console.log('billing_settings verificado');
	process.exit(0);
}

ensureBillingSettings().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
