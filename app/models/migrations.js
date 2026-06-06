const db = require('../db/knex');
const path = require('path');

const runMigrations = async () => {
	try {
		const [batchNo, log] = await db.migrate.latest({
			directory: path.join(__dirname, '../db/migrations'),
		});

		if (log.length === 0) {
			console.log('Database migrations: already up to date');
		} else {
			console.log(`Database migrations applied (batch ${batchNo}):`, log.join(', '));
		}
	} catch (error) {
		console.error('Error running database migrations:', error.message);
		throw error;
	}
};

const testDB = async () => {
	try {
		await runMigrations();
		await db.select().from('users');
		console.log('Database connected successfully');
	} catch (error) {
		console.log(error);
		console.log('Error establishing a database connection');
	}
};

module.exports = { testDB, runMigrations };
