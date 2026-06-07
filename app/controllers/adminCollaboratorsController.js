const userModel = require('../models/user');
const companyuserModel = require('../models/company_users');
const userrolModel = require('../models/user_rol');
const response = require('../config/response');
const generalConstants = require('../constants/constants');

const inviteCollaborator = async (req, res) => {
	try {
		const { email, id_company, id_rol } = req.body;

		if (!email || !id_company || !id_rol) {
			return response.error(req, res, { message: 'Email, empresa y rol son obligatorios' }, 422);
		}

		const user = await userModel.getUserByEmail({ email: String(email).trim() });
		if (!user) {
			return response.error(req, res, { message: 'No existe un usuario registrado con ese correo' }, 422);
		}

		const existing = await companyuserModel.getCompanyUserByUserId(user.id_users, parseInt(id_company, 10));
		if (existing) {
			return response.error(req, res, { message: 'El usuario ya está asociado a esta empresa' }, 422);
		}

		const companyUser = await companyuserModel.createCompanyUser(
			parseInt(id_company, 10),
			user.id_users,
			generalConstants.STATUS_ACTIVE
		);

		const companyUserRow = companyUser && companyUser[0];
		if (!companyUserRow) {
			return response.error(req, res, { message: 'No se pudo crear la relación con la empresa' }, 422);
		}

		await userrolModel.createUserRol(companyUserRow.id_company_user, parseInt(id_rol, 10));

		return response.success(req, res, {
			id_company_user: companyUserRow.id_company_user,
			id_users: user.id_users,
			email: user.email,
			name_user: user.name_user,
			last_name_user: user.last_name_user,
			id_rol: parseInt(id_rol, 10),
		}, 200);
	} catch (error) {
		return response.error(req, res, { message: `inviteCollaborator: ${error.message}` }, 422);
	}
};

module.exports = {
	inviteCollaborator,
};
