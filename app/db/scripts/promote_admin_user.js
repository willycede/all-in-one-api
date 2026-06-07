require('dotenv').config();
const knex = require('../knex');
const constants = require('../../constants/constants');
const { createUserRol } = require('../../models/user_rol');
const { createCompanyUser } = require('../../models/company_users');

const email = process.argv[2] || process.env.ADMIN_EMAIL;

async function getOrCreateDefaultCompany() {
	const existing = await knex('company')
		.where({ status: constants.STATUS_ACTIVE })
		.orderBy('id_company', 'asc')
		.first();

	if (existing) {
		return existing;
	}

	const result = await knex('company').insert({
		name: 'All in One',
		description: 'Empresa administradora',
		ruc: '1790000000001',
		phone: '0999999999',
		email: 'admin@allinone.local',
		status: constants.STATUS_ACTIVE,
		created_at: knex.fn.now(),
	});

	return knex('company').where({ id_company: result[0] }).first();
}

async function promoteAdminUser(userEmail) {
	if (!userEmail) {
		throw new Error('Indica el email: npm run promote:admin -- tu@email.com');
	}

	const user = await knex('users')
		.where({ email: userEmail, status: constants.STATUS_ACTIVE })
		.first();

	if (!user) {
		throw new Error(`No se encontró usuario activo con email: ${userEmail}`);
	}

	const company = await getOrCreateDefaultCompany();
	const companyId = company.id_company;

	let companyUser = await knex('company_users')
		.where({
			id_users: user.id_users,
			id_company: companyId,
			status: constants.STATUS_ACTIVE,
		})
		.first();

	if (!companyUser) {
		const created = await createCompanyUser(companyId, user.id_users, constants.STATUS_ACTIVE);
		companyUser = Array.isArray(created) ? created[0] : created;
		console.log(`[admin] Usuario asociado a empresa "${company.name}" (id ${companyId})`);
	}

	const idCompanyUser = companyUser.id_company_user;

	const adminRole = await knex('user_rol')
		.where({
			id_company_user: idCompanyUser,
			id_rol: constants.ADMIN_ROL,
		})
		.first();

	if (!adminRole) {
		await createUserRol(idCompanyUser, constants.ADMIN_ROL);
		console.log('[admin] Rol administrador (id_rol=1) asignado');
	} else {
		console.log('[admin] El usuario ya tenía rol administrador');
	}

	console.log('');
	console.log('Listo. Accede al panel así:');
	console.log(`  1. Abre http://localhost:8082/client/admin-login`);
	console.log(`  2. Email: ${userEmail}`);
	console.log(`  3. Empresa: ${company.name} (id ${companyId})`);
	console.log(`  4. Luego ve a /admin-panel`);
}

promoteAdminUser(email)
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('ERROR:', error.message);
		process.exit(1);
	});
