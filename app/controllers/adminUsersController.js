const adminUsersModel = require('../models/adminUsers');
const twoFactorService = require('../helpers/twoFactorService');
const auditLogService = require('../helpers/auditLogService');
const { trySendTwoFactorAdminDisabledEmail } = require('../helpers/twoFactorEmail');
const constants = require('../constants/constants');
const response = require('../config/response');

const listUsers = async (req, res) => {
	try {
		const { page, limit, search, twoFactor } = req.query;
		const result = await adminUsersModel.listUsersForAdmin({
			page,
			limit,
			search,
			twoFactorFilter: twoFactor || 'all',
		});
		return response.success(req, res, result, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

const disableUserTwoFactor = async (req, res) => {
	try {
		const targetId = parseInt(req.params.id_users, 10);
		if (Number.isNaN(targetId)) {
			return response.error(req, res, { message: 'ID de usuario inválido' }, 422);
		}

		const { reason } = req.body || {};
		const actor = req.userInfo || {};
		const targetUser = await adminUsersModel.getAdminUserById(targetId);
		const result = await twoFactorService.adminDisableTwoFactor(targetId);

		await auditLogService.logAuditEvent({
			eventType: 'security.2fa.admin_disabled',
			actorId: actor.id_users,
			targetId,
			actorEmail: actor.email,
			targetEmail: result.email,
			summary: `Administrador desactivó 2FA de ${result.email}`,
			metadata: {
				reason: reason ? String(reason).trim().slice(0, 500) : null,
				wasEnabled: result.wasEnabled,
				hadPending: result.hadPending,
				backupCount: result.backupCount,
			},
			req,
		});

		if (targetUser) {
			await trySendTwoFactorAdminDisabledEmail({
				user: targetUser,
				actor,
				reason: reason ? String(reason).trim() : null,
				wasEnabled: result.wasEnabled,
				hadPending: result.hadPending,
				source: 'admin_panel',
			});
		}

		return response.success(req, res, {
			...result,
			disabled: true,
		}, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

const updateUserStatus = async (req, res) => {
	try {
		const targetId = parseInt(req.params.id_users, 10);
		const { status } = req.body || {};
		const nextStatus = parseInt(status, 10);

		if (Number.isNaN(targetId)) {
			return response.error(req, res, { message: 'ID de usuario inválido' }, 422);
		}

		if (![constants.STATUS_ACTIVE, constants.STATUS_INACTIVE].includes(nextStatus)) {
			return response.error(req, res, { message: 'Estado inválido' }, 422);
		}

		const user = await adminUsersModel.getAdminUserById(targetId);
		if (!user) {
			return response.error(req, res, { message: 'Usuario no encontrado' }, 404);
		}

		if (user.status === nextStatus) {
			return response.success(req, res, {
				id: targetId,
				status: nextStatus,
				unchanged: true,
			}, 200);
		}

		await adminUsersModel.updateUserStatus(targetId, nextStatus);

		const actor = req.userInfo || {};
		const eventType = nextStatus === constants.STATUS_ACTIVE
			? 'admin.user.activated'
			: 'admin.user.deactivated';

		await auditLogService.logAuditEvent({
			eventType,
			actorId: actor.id_users,
			targetId,
			actorEmail: actor.email,
			targetEmail: user.email,
			summary: nextStatus === constants.STATUS_ACTIVE
				? `Administrador activó la cuenta de ${user.email}`
				: `Administrador inactivó la cuenta de ${user.email}`,
			metadata: {
				previousStatus: user.status,
				newStatus: nextStatus,
			},
			req,
		});

		return response.success(req, res, {
			id: targetId,
			status: nextStatus,
		}, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

module.exports = {
	listUsers,
	disableUserTwoFactor,
	updateUserStatus,
};
