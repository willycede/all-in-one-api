// Script de solo lectura: no escribe ni modifica nada en la base.
require('dotenv').config();
const knex = require('../knex');

const line = (title) => {
	console.log(`\n${'='.repeat(70)}\n${title}\n${'='.repeat(70)}`);
};

const describe = async (table) => {
	const exists = await knex.schema.hasTable(table);
	if (!exists) {
		console.log(`  (la tabla "${table}" no existe)`);
		return;
	}
	const columns = await knex(table).columnInfo();
	Object.keys(columns).forEach((name) => {
		const col = columns[name];
		console.log(`  ${name.padEnd(28)} ${col.type}${col.nullable ? ' NULL' : ' NOT NULL'}`);
	});
};

const inspect = async () => {
	line('ESTRUCTURA: general_categories');
	await describe('general_categories');

	line('ESTRUCTURA: category');
	await describe('category');

	line('CATEGORIAS GENERALES (nivel 1)');
	const generals = await knex('general_categories')
		.select('idgeneral_categories as id', 'name', 'description', 'status')
		.orderBy('idgeneral_categories', 'asc');
	generals.forEach((g) => {
		const estado = g.status === 1 ? 'activa' : `status=${g.status}`;
		console.log(`  [${String(g.id).padStart(3)}] ${String(g.name).padEnd(28)} ${estado}`);
	});

	line('CATEGORIAS (nivel 2) AGRUPADAS POR CATEGORIA GENERAL');
	const categories = await knex('category as c')
		.leftJoin('general_categories as g', 'g.idgeneral_categories', 'c.id_general_category')
		.select(
			'c.id_category as id',
			'c.name',
			'c.status',
			'c.id_general_category as generalId',
			'c.id_parent_category as parentId',
			'g.name as generalName'
		)
		.orderBy(['c.id_general_category', 'c.id_category']);

	const grouped = categories.reduce((acc, cat) => {
		const key = `${cat.generalId} - ${cat.generalName || '(sin categoria general)'}`;
		acc[key] = acc[key] || [];
		acc[key].push(cat);
		return acc;
	}, {});

	Object.keys(grouped).forEach((key) => {
		console.log(`\n  ${key}`);
		grouped[key].forEach((cat) => {
			const estado = cat.status === 1 ? 'activa' : `status=${cat.status}`;
			const parent = cat.parentId ? `padre=${cat.parentId}` : 'raíz';
			console.log(`      [${String(cat.id).padStart(3)}] ${String(cat.name).padEnd(26)} ${parent.padEnd(12)} ${estado}`);
		});
	});

	line('PRODUCTOS POR CATEGORIA (via tabla features)');
	const counts = await knex('features as f')
		.join('category as c', 'c.id_category', 'f.id_category')
		.leftJoin('general_categories as g', 'g.idgeneral_categories', 'c.id_general_category')
		.leftJoin('products as p', 'p.id_products', 'f.id_products')
		.select(
			'g.idgeneral_categories as generalId',
			'g.name as generalName',
			'c.id_category as categoryId',
			'c.name as categoryName'
		)
		.count({ productos: 'f.id_products' })
		.countDistinct({ activos: 'p.id_products' })
		.groupBy('g.idgeneral_categories', 'g.name', 'c.id_category', 'c.name')
		.orderBy(['g.idgeneral_categories', 'c.id_category']);

	counts.forEach((row) => {
		const general = `${row.generalId} ${row.generalName || '(sin general)'}`;
		console.log(
			`  ${general.padEnd(32)} > ${String(row.categoryName).padEnd(26)} ` +
			`filas=${row.productos} productos=${row.activos}`
		);
	});

	line('PRODUCTOS SIN NINGUNA CATEGORIA ASIGNADA');
	const orphans = await knex('products as p')
		.leftJoin('features as f', 'f.id_products', 'p.id_products')
		.whereNull('f.id_products')
		.select('p.id_products as id', 'p.name', 'p.status');
	if (orphans.length === 0) {
		console.log('  (ninguno)');
	} else {
		orphans.forEach((p) => {
			console.log(`  [${String(p.id).padStart(4)}] ${String(p.name).padEnd(40)} status=${p.status}`);
		});
	}

	line('PRODUCTOS EN MAS DE UNA CATEGORIA');
	const multi = await knex('features as f')
		.join('products as p', 'p.id_products', 'f.id_products')
		.select('p.id_products as id', 'p.name')
		.countDistinct({ categorias: 'f.id_category' })
		.groupBy('p.id_products', 'p.name')
		.having(knex.raw('count(distinct f.id_category) > 1'));
	if (multi.length === 0) {
		console.log('  (ninguno)');
	} else {
		multi.forEach((p) => {
			console.log(`  [${String(p.id).padStart(4)}] ${String(p.name).padEnd(40)} en ${p.categorias} categorias`);
		});
	}
};

inspect()
	.then(() => knex.destroy())
	.catch((error) => {
		console.error('[inspect_category_tree] Error:', error.message);
		return knex.destroy().then(() => process.exit(1));
	});
