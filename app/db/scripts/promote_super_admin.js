/**
 * Otorga el rol super administrador (id_rol=3) a un usuario existente.
 * El super admin puede ingresar al panel con cualquier empresa (o sin seleccionar ninguna).
 *
 * Uso:
 *   npm run promote:super-admin -- tu@email.com
 */
require('dotenv').config();
const knex = require('../knex');
const constants = require('../../constants/constants');
const { createUserRol } = require('../../models/user_rol');
const { createCompanyUser } = require('../../models/company_users');

const email = process.argv[2] || process.env.ADMIN_EMAIL;

async function getAnchorCompany() {
	const existing = await knex('company')
		.where({ status: constants.STATUS_ACTIVE })
		.orderBy('id_company', 'asc')
		.first();

	if (!existing) {
		throw new Error('No hay empresas activas. Crea una empresa antes de asignar el super admin.');
	}

	return existing;
}

async function promoteSuperAdmin(userEmail) {
	if (!userEmail) {
		throw new Error('Indica el email: npm run promote:super-admin -- tu@email.com');
	}

	const role = await knex('rol').where({ id_rol: constants.SUPER_ADMIN_ROL }).first();
	if (!role) {
		throw new Error('Falta el rol super administrador. Ejecuta primero: npm run migrate');
	}

	const user = await knex('users')
		.where({ email: userEmail, status: constants.STATUS_ACTIVE })
		.first();

	if (!user) {
		throw new Error(`No se encontró usuario activo con email: ${userEmail}`);
	}

	const existingSuperAdmin = await knex('user_rol')
		.join('company_users', 'company_users.id_company_user', 'user_rol.id_company_user')
		.where({
			'company_users.id_users': user.id_users,
			'user_rol.id_rol': constants.SUPER_ADMIN_ROL,
		})
		.first();

	if (existingSuperAdmin) {
		console.log('[super-admin] El usuario ya tenía rol super administrador');
		return;
	}

	// El rol vive en user_rol, que cuelga de company_users: se reutiliza cualquier
	// vínculo existente porque el alcance del super admin no depende de la empresa.
	const company = await getAnchorCompany();

	let companyUser = await knex('company_users')
		.where({
			id_users: user.id_users,
			id_company: company.id_company,
			status: constants.STATUS_ACTIVE,
		})
		.first();

	if (!companyUser) {
		const created = await createCompanyUser(company.id_company, user.id_users, constants.STATUS_ACTIVE);
		companyUser = Array.isArray(created) ? created[0] : created;
		console.log(`[super-admin] Usuario asociado a empresa "${company.name}" (id ${company.id_company})`);
	}

	await createUserRol(companyUser.id_company_user, constants.SUPER_ADMIN_ROL);
	console.log(`[super-admin] Rol super administrador (id_rol=${constants.SUPER_ADMIN_ROL}) asignado a ${userEmail}`);
	console.log('');
	console.log('Ahora puedes ingresar en /client/admin-login con cualquier empresa,');
	console.log('o dejando el selector en "Todas las empresas".');
}

promoteSuperAdmin(email)
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('ERROR:', error.message);
		process.exit(1);
	});
