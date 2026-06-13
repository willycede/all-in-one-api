require('dotenv').config();
const twoFactorService = require('../../helpers/twoFactorService');
const auditLogService = require('../../helpers/auditLogService');
const { trySendTwoFactorAdminDisabledEmail } = require('../../helpers/twoFactorEmail');
const knex = require('../knex');

const USAGE = [
	'Uso:',
	'  npm run disable:2fa -- usuario@email.com',
	'  npm run disable:2fa -- --id=42',
	'',
	'Desactiva el 2FA del usuario y borra secretos TOTP y códigos de respaldo.',
	'También limpia una configuración pendiente (two_factor_pending_secret).',
].join('\n');

const parseArgs = (argv) => {
	const args = argv.slice(2).filter(Boolean);
	let idUsers = null;
	let email = null;

	for (const arg of args) {
		if (arg === '--help' || arg === '-h') {
			return { help: true };
		}
		if (arg.startsWith('--id=')) {
			idUsers = Number(arg.split('=')[1]);
			continue;
		}
		if (!arg.startsWith('--')) {
			email = arg.trim().toLowerCase();
		}
	}

	return { idUsers, email };
};

const findUser = async ({ idUsers, email }) => {
	if (idUsers) {
		return knex('users').where({ id_users: idUsers }).first();
	}
	if (email) {
		return knex('users').whereRaw('LOWER(email) = ?', [email]).first();
	}
	return null;
};

const disableTwoFactor = async ({ idUsers, email }) => {
	const user = await findUser({ idUsers, email });
	if (!user) {
		throw new Error('No se encontró el usuario. Verifica el email o el id.');
	}

	const result = await twoFactorService.adminDisableTwoFactor(user.id_users);

	await auditLogService.logAuditEvent({
		eventType: 'security.2fa.cli_disabled',
		targetId: user.id_users,
		targetEmail: result.email,
		summary: `2FA desactivado vía script CLI (${result.email})`,
		metadata: {
			wasEnabled: result.wasEnabled,
			hadPending: result.hadPending,
			backupCount: result.backupCount,
		},
	});

	await trySendTwoFactorAdminDisabledEmail({
		user,
		reason: null,
		wasEnabled: result.wasEnabled,
		hadPending: result.hadPending,
		source: 'cli',
	});

	console.log('[2fa] 2FA desactivado correctamente');
	console.log(`  Usuario: ${result.email}`);
	console.log(`  ID:      ${user.id_users}`);
	console.log(`  Antes:   enabled=${result.wasEnabled}, pending=${result.hadPending}, backupCodes=${result.backupCount}`);
	console.log('');
	console.log('El usuario ya puede iniciar sesión solo con email y contraseña.');
};

const { help, idUsers, email } = parseArgs(process.argv);

if (help || (!idUsers && !email)) {
	console.log(USAGE);
	process.exit(help ? 0 : 1);
}

disableTwoFactor({ idUsers, email })
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('ERROR:', error.message);
		process.exit(1);
	});
