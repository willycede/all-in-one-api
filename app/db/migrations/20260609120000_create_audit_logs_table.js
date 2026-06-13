exports.up = async function up(knex) {
	const exists = await knex.schema.hasTable('audit_logs');
	if (exists) return;

	await knex.schema.createTable('audit_logs', (table) => {
		table.increments('id_audit_log').unsigned().primary();
		table.string('event_type', 80).notNullable().index();
		table.integer('actor_id_users').unsigned().nullable().index();
		table.integer('target_id_users').unsigned().nullable().index();
		table.string('actor_email', 200).nullable();
		table.string('target_email', 200).nullable();
		table.string('summary', 500).notNullable();
		table.text('metadata').nullable();
		table.string('ip_address', 45).nullable();
		table.string('user_agent', 500).nullable();
		table.timestamp('created_at').defaultTo(knex.fn.now()).index();
	});
};

exports.down = async function down(knex) {
	if (await knex.schema.hasTable('audit_logs')) {
		await knex.schema.dropTable('audit_logs');
	}
};
