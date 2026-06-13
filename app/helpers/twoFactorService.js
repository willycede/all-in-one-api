const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const knex = require('../db/knex');
const { encryptSecret, decryptSecret } = require('./twoFactorCrypto');

const TOTP_ISSUER = process.env.TOTP_ISSUER || process.env.MAIL_BRAND_NAME || 'All In One';
const TOTP_LOGO_URL = process.env.TOTP_LOGO_URL
	|| `${(process.env.PUBLIC_APP_URL || 'https://aioecuador.com').replace(/\/$/, '')}/static/images/logo/AIO_LOGO_NAME_BLACK&COLOR.png`;
const TWO_FACTOR_PENDING_PURPOSE = '2fa_pending';

const buildTotpSecret = (user) => speakeasy.generateSecret({
	name: user.email,
	issuer: TOTP_ISSUER,
	length: 32,
});

const sanitizeUser = (user) => {
	const safe = { ...user };
	delete safe.password;
	delete safe.totp_secret;
	delete safe.two_factor_pending_secret;
	delete safe.two_factor_backup_codes;
	return safe;
};

const getUserSecurity = async (idUsers) => knex('users')
	.where({ id_users: idUsers })
	.first();

const generateBackupCodes = (count = 8) => {
	const codes = [];
	for (let i = 0; i < count; i += 1) {
		codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
	}
	return codes;
};

const hashBackupCodes = (codes) => codes.map((code) => bcrypt.hashSync(code, 10));

const verifyTotpCode = (secret, token) => speakeasy.totp.verify({
	secret,
	encoding: 'base32',
	token: String(token).replace(/\s/g, ''),
	window: 1,
});

const createPendingTwoFactorToken = (user) => jwt.sign(
	{
		id_users: user.id_users,
		purpose: TWO_FACTOR_PENDING_PURPOSE,
	},
	process.env.JWT_SECRET_KEY,
	{ expiresIn: '10m' }
);

const verifyPendingTwoFactorToken = (token) => {
	const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
	if (!decoded || decoded.purpose !== TWO_FACTOR_PENDING_PURPOSE) {
		throw new Error('Token de verificación 2FA inválido');
	}
	return decoded;
};

const setupTwoFactor = async (idUsers) => {
	const user = await getUserSecurity(idUsers);
	if (!user) throw new Error('Usuario no encontrado');
	if (user.two_factor_enabled) throw new Error('La autenticación en dos pasos ya está activa');

	const secret = buildTotpSecret(user);

	await knex('users')
		.where({ id_users: idUsers })
		.update({
			two_factor_pending_secret: encryptSecret(secret.base32),
			updated_at: knex.fn.now(),
		});

	const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

	return {
		manualKey: secret.base32,
		qrCodeDataUrl,
		issuer: TOTP_ISSUER,
		accountLabel: `${TOTP_ISSUER}: ${user.email}`,
		email: user.email,
		logoUrl: TOTP_LOGO_URL,
	};
};

const enableTwoFactor = async (idUsers, token) => {
	const user = await getUserSecurity(idUsers);
	if (!user) throw new Error('Usuario no encontrado');
	if (user.two_factor_enabled) throw new Error('La autenticación en dos pasos ya está activa');

	const pendingSecret = decryptSecret(user.two_factor_pending_secret);
	if (!pendingSecret) throw new Error('Primero debes iniciar la configuración de 2FA');

	if (!verifyTotpCode(pendingSecret, token)) {
		throw new Error('Código de verificación incorrecto');
	}

	const backupCodes = generateBackupCodes();
	const hashedCodes = hashBackupCodes(backupCodes);

	await knex('users')
		.where({ id_users: idUsers })
		.update({
			two_factor_enabled: true,
			totp_secret: encryptSecret(pendingSecret),
			two_factor_pending_secret: null,
			two_factor_backup_codes: JSON.stringify(hashedCodes),
			two_factor_enabled_at: knex.fn.now(),
			updated_at: knex.fn.now(),
		});

	return { backupCodes };
};

const disableTwoFactor = async (idUsers, token, password) => {
	const user = await getUserSecurity(idUsers);
	if (!user) throw new Error('Usuario no encontrado');
	if (!user.two_factor_enabled) throw new Error('La autenticación en dos pasos no está activa');

	if (!bcrypt.compareSync(password, user.password)) {
		throw new Error('Contraseña incorrecta');
	}

	const secret = decryptSecret(user.totp_secret);
	const isValidTotp = secret && verifyTotpCode(secret, token);
	const isValidBackup = !isValidTotp && await consumeBackupCode(user, token);

	if (!isValidTotp && !isValidBackup) {
		throw new Error('Código de verificación incorrecto');
	}

	await resetTwoFactorState(idUsers);
};

const resetTwoFactorState = async (idUsers) => knex('users')
	.where({ id_users: idUsers })
	.update({
		two_factor_enabled: false,
		totp_secret: null,
		two_factor_pending_secret: null,
		two_factor_backup_codes: null,
		two_factor_enabled_at: null,
		updated_at: knex.fn.now(),
	});

const adminDisableTwoFactor = async (targetIdUsers) => {
	const user = await getUserSecurity(targetIdUsers);
	if (!user) throw new Error('Usuario no encontrado');

	const wasEnabled = !!user.two_factor_enabled;
	const hadPending = !!user.two_factor_pending_secret;
	let backupCount = 0;

	try {
		backupCount = JSON.parse(user.two_factor_backup_codes || '[]').length;
	} catch (error) {
		backupCount = 0;
	}

	if (!wasEnabled && !hadPending) {
		throw new Error('El usuario no tiene 2FA activo ni configuración pendiente');
	}

	await resetTwoFactorState(targetIdUsers);

	return {
		email: user.email,
		wasEnabled,
		hadPending,
		backupCount,
	};
};

const consumeBackupCode = async (user, token) => {
	const normalized = String(token).replace(/\s/g, '').toUpperCase();
	if (!normalized) return false;

	let hashedCodes = [];
	try {
		hashedCodes = JSON.parse(user.two_factor_backup_codes || '[]');
	} catch (error) {
		hashedCodes = [];
	}

	const matchIndex = hashedCodes.findIndex((hash) => bcrypt.compareSync(normalized, hash));
	if (matchIndex === -1) return false;

	hashedCodes.splice(matchIndex, 1);
	await knex('users')
		.where({ id_users: user.id_users })
		.update({
			two_factor_backup_codes: JSON.stringify(hashedCodes),
			updated_at: knex.fn.now(),
		});

	return true;
};

const verifyLoginTwoFactor = async (twoFactorToken, code) => {
	const decoded = verifyPendingTwoFactorToken(twoFactorToken);
	const user = await getUserSecurity(decoded.id_users);

	if (!user || !user.two_factor_enabled) {
		throw new Error('Autenticación en dos pasos no configurada');
	}

	const secret = decryptSecret(user.totp_secret);
	const isValidTotp = secret && verifyTotpCode(secret, code);
	const isValidBackup = !isValidTotp && await consumeBackupCode(user, code);

	if (!isValidTotp && !isValidBackup) {
		throw new Error('Código de verificación incorrecto');
	}

	return sanitizeUser(user);
};

const getTwoFactorStatus = async (idUsers) => {
	const user = await getUserSecurity(idUsers);
	if (!user) throw new Error('Usuario no encontrado');

	let backupCodesRemaining = 0;
	try {
		backupCodesRemaining = JSON.parse(user.two_factor_backup_codes || '[]').length;
	} catch (error) {
		backupCodesRemaining = 0;
	}

	return {
		enabled: !!user.two_factor_enabled,
		enabledAt: user.two_factor_enabled_at,
		backupCodesRemaining,
		hasPendingSetup: !!user.two_factor_pending_secret,
	};
};

module.exports = {
	sanitizeUser,
	createPendingTwoFactorToken,
	verifyLoginTwoFactor,
	setupTwoFactor,
	enableTwoFactor,
	disableTwoFactor,
	adminDisableTwoFactor,
	getTwoFactorStatus,
	isTwoFactorEnabled: (user) => !!(user && user.two_factor_enabled),
	TOTP_ISSUER,
};
