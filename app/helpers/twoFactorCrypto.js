const crypto = require('crypto');

const getKey = () => crypto.scryptSync(
	process.env.JWT_SECRET_KEY || 'aio-dev-secret',
	'aio-totp-salt',
	32
);

const encryptSecret = (plainText) => {
	if (!plainText) return null;
	const key = getKey();
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
	let encrypted = cipher.update(String(plainText), 'utf8', 'hex');
	encrypted += cipher.final('hex');
	return `${iv.toString('hex')}:${encrypted}`;
};

const decryptSecret = (stored) => {
	if (!stored) return null;
	const [ivHex, encrypted] = String(stored).split(':');
	if (!ivHex || !encrypted) return null;
	const key = getKey();
	const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'));
	let decrypted = decipher.update(encrypted, 'hex', 'utf8');
	decrypted += decipher.final('utf8');
	return decrypted;
};

module.exports = {
	encryptSecret,
	decryptSecret,
};
