require('dotenv').config();
const { ensureBillingSchema } = require('../billingSchema');

ensureBillingSchema()
	.then(() => {
		console.log('[billing] Esquema de facturación verificado');
		process.exit(0);
	})
	.catch((error) => {
		console.error('[billing] ERROR:', error.message);
		process.exit(1);
	});
