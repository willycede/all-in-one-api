const ACTIVE = 1;
const INACTIVE = 2;

const TARGETS = [
	{
		name: 'Asientos',
		description: 'Tapices y asientos para vehículos',
		children: ['Cuero', 'Eco cuero', 'Eco cuero standard'],
	},
	{
		name: 'Protección Vehicular',
		description: 'Productos de protección vehicular',
		children: ['PPF', 'Láminas de Seguridad', 'Nano Cerámico'],
	},
];

const firstInsertedId = (result) => (
	Array.isArray(result) ? result[0] : result
);

const schemaName = (knex) => knex.client.config.connection.database;

const getParentForeignKey = (knex) => knex('information_schema.KEY_COLUMN_USAGE')
	.where({
		TABLE_SCHEMA: schemaName(knex),
		TABLE_NAME: 'category',
		COLUMN_NAME: 'id_parent_category',
		REFERENCED_TABLE_NAME: 'category',
	})
	.first();

const getParentIndex = (knex) => knex('information_schema.STATISTICS')
	.where({
		TABLE_SCHEMA: schemaName(knex),
		TABLE_NAME: 'category',
		INDEX_NAME: 'category_parent_idx',
	})
	.first();

exports.up = async function up(knex) {
	const hasParentColumn = await knex.schema.hasColumn('category', 'id_parent_category');
	if (!hasParentColumn) {
		await knex.schema.table('category', (table) => {
			table.integer('id_parent_category').nullable().index('category_parent_idx');
		});
	} else if (!(await getParentIndex(knex))) {
		await knex.schema.table('category', (table) => {
			table.index('id_parent_category', 'category_parent_idx');
		});
	}

	await knex.transaction(async (trx) => {
		const accessories = await trx('general_categories')
			.where({ name: 'Accesorios' })
			.first();
		const sourceGenerals = await trx('general_categories')
			.whereIn('name', TARGETS.map((target) => target.name));

		if (!sourceGenerals.length) {
			return;
		}
		if (!accessories) {
			throw new Error('No se encontró la categoría general "Accesorios"');
		}

		for (const target of TARGETS) {
			const sourceGeneral = sourceGenerals.find((row) => row.name === target.name);
			if (!sourceGeneral) {
				continue;
			}

			const sourceChildren = await trx('category')
				.where({ id_general_category: sourceGeneral.idgeneral_categories })
				.whereIn('name', target.children);

			let parent = await trx('category')
				.where({
					id_general_category: accessories.idgeneral_categories,
					name: target.name,
				})
				.whereNull('id_parent_category')
				.first();

			if (!parent) {
				const companyId = sourceChildren[0] && sourceChildren[0].id_company;
				if (!companyId) {
					throw new Error(`No se encontró una compañía para migrar "${target.name}"`);
				}
				const inserted = await trx('category').insert({
					id_company: companyId,
					id_general_category: accessories.idgeneral_categories,
					id_parent_category: null,
					name: target.name,
					description: target.description,
					status: ACTIVE,
					created_at: trx.fn.now(),
					updated_at: trx.fn.now(),
				});
				parent = await trx('category')
					.where({ id_category: firstInsertedId(inserted) })
					.first();
			} else if (parent.status !== ACTIVE) {
				await trx('category')
					.where({ id_category: parent.id_category })
					.update({ status: ACTIVE, updated_at: trx.fn.now() });
			}

			await trx('category')
				.where({ id_general_category: sourceGeneral.idgeneral_categories })
				.whereIn('name', target.children)
				.update({
					id_general_category: accessories.idgeneral_categories,
					id_parent_category: parent.id_category,
					updated_at: trx.fn.now(),
				});

			await trx('general_categories')
				.where({ idgeneral_categories: sourceGeneral.idgeneral_categories })
				.update({ status: INACTIVE });
		}
	});

	const foreignKey = await getParentForeignKey(knex);
	if (!foreignKey) {
		await knex.schema.table('category', (table) => {
			table
				.foreign('id_parent_category', 'category_parent_fk')
				.references('id_category')
				.inTable('category')
				.onDelete('RESTRICT')
				.onUpdate('CASCADE');
		});
	}
};

exports.down = async function down(knex) {
	const hasParentColumn = await knex.schema.hasColumn('category', 'id_parent_category');
	if (!hasParentColumn) {
		return;
	}

	await knex.transaction(async (trx) => {
		const accessories = await trx('general_categories')
			.where({ name: 'Accesorios' })
			.first();

		for (const target of TARGETS) {
			const sourceGeneral = await trx('general_categories')
				.where({ name: target.name })
				.first();
			if (!sourceGeneral || !accessories) {
				continue;
			}

			const parent = await trx('category')
				.where({
					id_general_category: accessories.idgeneral_categories,
					name: target.name,
				})
				.whereNull('id_parent_category')
				.first();

			if (parent) {
				await trx('category')
					.where({ id_parent_category: parent.id_category })
					.whereIn('name', target.children)
					.update({
						id_general_category: sourceGeneral.idgeneral_categories,
						id_parent_category: null,
						updated_at: trx.fn.now(),
					});

				const hasProducts = await trx('features')
					.where({ id_category: parent.id_category })
					.first();
				const hasChildren = await trx('category')
					.where({ id_parent_category: parent.id_category })
					.first();
				if (!hasProducts && !hasChildren) {
					await trx('category').where({ id_category: parent.id_category }).del();
				}
			}

			await trx('general_categories')
				.where({ idgeneral_categories: sourceGeneral.idgeneral_categories })
				.update({ status: ACTIVE });
		}
	});

	if (await getParentForeignKey(knex)) {
		await knex.schema.table('category', (table) => {
			table.dropForeign('id_parent_category', 'category_parent_fk');
		});
	}
	const parentIndex = await getParentIndex(knex);
	await knex.schema.table('category', (table) => {
		if (parentIndex) {
			table.dropIndex('id_parent_category', 'category_parent_idx');
		}
		table.dropColumn('id_parent_category');
	});
};
