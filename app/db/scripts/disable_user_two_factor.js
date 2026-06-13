require('dotenv').config();
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

	const wasEnabled = !!user.two_factor_enabled;
	const hadPending = !!user.two_factor_pending_secret;
	let backupCount = 0;

	try {
		backupCount = JSON.parse(user.two_factor_backup_codes || '[]').length;
	} catch (error) {
		backupCount = 0;
	}

	if (!wasEnabled && !hadPending) {
		console.log(`[2fa] El usuario ${user.email} (id ${user.id_users}) no tiene 2FA activo ni configuración pendiente.`);
		return;
	}

	await knex('users')
		.where({ id_users: user.id_users })
		.update({
			two_factor_enabled: false,
			totp_secret: null,
			two_factor_pending_secret: null,
			two_factor_backup_codes: null,
			two_factor_enabled_at: null,
			updated_at: knex.fn.now(),
		});

	console.log('[2fa] 2FA desactivado correctamente');
	console.log(`  Usuario: ${user.email}`);
	console.log(`  ID:      ${user.id_users}`);
	console.log(`  Antes:   enabled=${wasEnabled}, pending=${hadPending}, backupCodes=${backupCount}`);
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
