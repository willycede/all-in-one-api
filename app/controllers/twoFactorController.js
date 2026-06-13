const twoFactorService = require('../helpers/twoFactorService');
const { sendTwoFactorEnabledEmail } = require('../helpers/twoFactorEmail');
const { issueUserSession } = require('../helpers/authSession');
const auditLogService = require('../helpers/auditLogService');
const userModel = require('../models/user');
const response = require('../config/response');

const getStatus = async (req, res) => {
	try {
		const idUsers = req.userInfo.id_users;
		const status = await twoFactorService.getTwoFactorStatus(idUsers);
		return response.success(req, res, status, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

const setup = async (req, res) => {
	try {
		const idUsers = req.userInfo.id_users;
		const userEmail = req.userInfo.email;
		const result = await twoFactorService.setupTwoFactor(idUsers);

		await auditLogService.logAuditEvent({
			eventType: 'security.2fa.setup_started',
			actorId: idUsers,
			targetId: idUsers,
			actorEmail: userEmail,
			targetEmail: userEmail,
			summary: `Usuario inició configuración de 2FA (${userEmail})`,
			req,
		});

		return response.success(req, res, result, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

const enable = async (req, res) => {
	try {
		const idUsers = req.userInfo.id_users;
		const { token } = req.body;
		if (!token) {
			return response.error(req, res, { message: 'Código de verificación requerido' }, 422);
		}

		const { backupCodes } = await twoFactorService.enableTwoFactor(idUsers, token);
		const users = await userModel.getUserById({ id_users: idUsers });
		const user = users && users[0];

		if (user && user.email) {
			try {
				await sendTwoFactorEnabledEmail({ user, backupCodesCount: backupCodes.length });
			} catch (mailError) {
				console.error('[2fa:enable:email]', mailError.message);
			}

			await auditLogService.logAuditEvent({
				eventType: 'security.2fa.enabled',
				actorId: idUsers,
				targetId: idUsers,
				actorEmail: user.email,
				targetEmail: user.email,
				summary: `Usuario activó 2FA (${user.email})`,
				metadata: { backupCodesCount: backupCodes.length },
				req,
			});
		}

		return response.success(req, res, {
			enabled: true,
			backupCodes,
		}, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

const disable = async (req, res) => {
	try {
		const idUsers = req.userInfo.id_users;
		const { token, password } = req.body;
		if (!token || !password) {
			return response.error(req, res, { message: 'Código y contraseña requeridos' }, 422);
		}

		const userEmail = req.userInfo.email;
		await twoFactorService.disableTwoFactor(idUsers, token, password);

		await auditLogService.logAuditEvent({
			eventType: 'security.2fa.disabled_by_user',
			actorId: idUsers,
			targetId: idUsers,
			actorEmail: userEmail,
			targetEmail: userEmail,
			summary: `Usuario desactivó su propio 2FA (${userEmail})`,
			req,
		});

		return response.success(req, res, { enabled: false }, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

const verifyLogin = async (req, res) => {
	try {
		const { twoFactorToken, code, isAdmin, company_id } = req.body;
		if (!twoFactorToken || !code) {
			return response.error(req, res, { message: 'Token y código requeridos' }, 422);
		}

		const user = await twoFactorService.verifyLoginTwoFactor(twoFactorToken, code);

		let fullUser;
		if (isAdmin) {
			fullUser = await userModel.getUserByCompanyAndEmail({
				email: user.email,
				company_id,
			});
		} else {
			fullUser = await userModel.getUserByEmailRolClient({ email: user.email });
		}

		if (!fullUser) {
			return response.error(req, res, { message: 'Usuario no encontrado' }, 404);
		}

		fullUser.two_factor_enabled = true;

		await auditLogService.logAuditEvent({
			eventType: 'security.2fa.login_verified',
			actorId: fullUser.id_users,
			targetId: fullUser.id_users,
			actorEmail: fullUser.email,
			targetEmail: fullUser.email,
			summary: `Inicio de sesión verificado con 2FA (${fullUser.email})`,
			metadata: { isAdmin: !!isAdmin },
			req,
		});

		return issueUserSession(req, res, fullUser, { isAdmin: !!isAdmin });
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

module.exports = {
	getStatus,
	setup,
	enable,
	disable,
	verifyLogin,
};
