exports.up = async function up(knex) {
	const hasTable = await knex.schema.hasTable('invoice_data');
	if (hasTable) {
		return;
	}

	await knex.schema.createTable('invoice_data', (t) => {
		t.increments('id_invoice_data').primary();
		t.integer('id_user').unsigned().notNullable();
		t.string('type_id', 1).notNullable();
		t.string('id_document', 20).notNullable();
		t.string('razon_social', 255).notNullable();
		t.string('razon_comercial', 255).nullable();
		t.string('address', 500).notNullable();
		t.string('mail', 255).notNullable();
		t.boolean('principal').notNullable().defaultTo(true);
		t.timestamp('created_at').defaultTo(knex.fn.now());
		t.timestamp('updated_at').defaultTo(knex.fn.now());
		t.index(['id_user', 'principal'], 'invoice_data_user_principal_idx');
	});

	const users = await knex('users')
		.select(
			'id_users',
			'name_user',
			'last_name_user',
			'identification_number',
			'address',
			'email',
		)
		.whereNotNull('identification_number')
		.where('identification_number', '!=', '');

	for (const user of users) {
		const doc = String(user.identification_number || '').trim();
		if (!doc) continue;

		let typeId = 'P';
		if (doc.length === 13) typeId = 'R';
		else if (doc.length === 10) typeId = 'C';

		const razonSocial = String(user.name_user || '').trim();
		const razonComercial = String(user.last_name_user || '').trim();
		const address = String(user.address || '').trim();
		const mail = String(user.email || '').trim();

		if (!razonSocial || !address || !mail) continue;
		if (typeId === 'C' && !razonComercial) continue;
		if (typeId === 'R' && !razonComercial) continue;

		await knex('invoice_data').insert({
			id_user: user.id_users,
			type_id: typeId,
			id_document: doc,
			razon_social: razonSocial,
			razon_comercial: razonComercial,
			address,
			mail,
			principal: true,
		});
	}
};

exports.down = async function down(knex) {
	await knex.schema.dropTableIfExists('invoice_data');
};
