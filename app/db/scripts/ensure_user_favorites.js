require('dotenv').config();
const { ensureUserFavoritesTable } = require('../../models/migrations');
const db = require('../knex');

ensureUserFavoritesTable()
	.then(async () => {
		const exists = await db.schema.hasTable('user_favorites');
		if (exists) {
			console.log('OK: tabla user_favorites lista.');
		} else {
			console.error('ERROR: no se pudo crear user_favorites.');
			process.exit(1);
		}
		process.exit(0);
	})
	.catch((error) => {
		console.error('ERROR:', error.message);
		process.exit(1);
	});
