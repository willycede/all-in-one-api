const jwt = require('jsonwebtoken');
const moment = require('moment');
const userModel = require('../models/user');
const twoFactorService = require('./twoFactorService');
const response = require('../config/response');

const issueUserSession = async (req, res, user, { isAdmin = false } = {}) => {
	const safeUser = { ...user };
	safeUser.id_users = safeUser.id_users;

	const tokenPayload = isAdmin
		? { user: safeUser }
		: {
			id_users: safeUser.id_users,
			name_user: safeUser.name_user,
			last_name_user: safeUser.last_name_user,
			identification_number: safeUser.identification_number,
			email: safeUser.email,
			two_factor_verified: true,
		};

	const token = jwt.sign(tokenPayload, process.env.JWT_SECRET_KEY, { expiresIn: '720d' });
	const timestamp = moment().add(720, 'days').unix();

	safeUser.access_token = token;
	safeUser.token_expires_in = timestamp;
	await userModel.updateUserSessionData({ user: safeUser });

	const responseUser = twoFactorService.sanitizeUser(safeUser);
	responseUser.two_factor_enabled = !!user.two_factor_enabled;

	return response.success(req, res, responseUser, 200);
};

const handleLoginAfterCredentials = async (req, res, user, { isAdmin = false } = {}) => {
	if (twoFactorService.isTwoFactorEnabled(user)) {
		const twoFactorToken = twoFactorService.createPendingTwoFactorToken(user);
		return response.success(req, res, {
			requiresTwoFactor: true,
			twoFactorToken,
			id_users: user.id_users,
			email: user.email,
			isAdmin,
		}, 200);
	}

	return issueUserSession(req, res, user, { isAdmin });
};

module.exports = {
	issueUserSession,
	handleLoginAfterCredentials,
};
