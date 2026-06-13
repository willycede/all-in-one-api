exports.up = async function up(knex) {
	const hasColumn = await knex.schema.hasColumn('billing_settings', 'signature_deploy_path');
	if (!hasColumn) {
		await knex.schema.table('billing_settings', (t) => {
			t.string('signature_deploy_path', 500).nullable();
		});
	}
};

exports.down = async function down(knex) {
	const hasColumn = await knex.schema.hasColumn('billing_settings', 'signature_deploy_path');
	if (hasColumn) {
		await knex.schema.table('billing_settings', (t) => {
			t.dropColumn('signature_deploy_path');
		});
	}
};
