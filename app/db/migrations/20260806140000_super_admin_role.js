const constants = require('../../constants/constants');

const SUPER_ADMIN_NAME = 'Super administrador';

exports.up = async function up(knex) {
	const existing = await knex('rol')
		.where({ id_rol: constants.SUPER_ADMIN_ROL })
		.first();

	if (existing) {
		if (existing.name !== SUPER_ADMIN_NAME) {
			throw new Error(
				`El id_rol ${constants.SUPER_ADMIN_ROL} ya está ocupado por el rol "${existing.name}". `
				+ 'Reasigna ese rol antes de aplicar esta migración.'
			);
		}
		return;
	}

	await knex('rol').insert({
		id_rol: constants.SUPER_ADMIN_ROL,
		name: SUPER_ADMIN_NAME,
		description: 'Acceso administrativo sobre todas las empresas',
		status: constants.STATUS_ACTIVE,
	});
};

exports.down = async function down(knex) {
	const assigned = await knex('user_rol')
		.where({ id_rol: constants.SUPER_ADMIN_ROL })
		.first();

	if (assigned) {
		return;
	}

	await knex('rol')
		.where({ id_rol: constants.SUPER_ADMIN_ROL, name: SUPER_ADMIN_NAME })
		.del();
};
