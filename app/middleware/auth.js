const jwt = require('jsonwebtoken');
require('dotenv').config();

const extractUser = (decoded) => decoded.user || decoded;

const verifyToken = (req, res, next) => {
	const bearerHeader = req.headers.authorization;
	if (!bearerHeader) {
		return res.status(401).json({ error: { message: 'Token de autenticación requerido' }, data: {} });
	}

	try {
		const decoded = jwt.verify(bearerHeader, process.env.JWT_SECRET_KEY);
		req.userInfo = extractUser(decoded);
		next();
	} catch (error) {
		return res.status(403).json({ error: { message: 'Token inválido o expirado' }, data: {} });
	}
};

const assertSelfUser = (req, res, next) => {
	const tokenUserId = parseInt(req.userInfo && req.userInfo.id_users, 10);
	if (!tokenUserId) {
		return res.status(403).json({ error: { message: 'No autorizado' }, data: {} });
	}

	const candidates = [
		req.params.id_user,
		req.params.id,
		req.body && req.body.id_user,
		req.query && req.query.id_user,
	].map((value) => parseInt(value, 10)).filter((value) => !Number.isNaN(value));

	if (candidates.length === 0) {
		return next();
	}

	if (candidates.every((id) => id === tokenUserId)) {
		return next();
	}

	return res.status(403).json({ error: { message: 'No tienes permiso para acceder a este recurso' }, data: {} });
};

const assertAdmin = (req, res, next) => {
	const user = req.userInfo || {};
	const roleId = parseInt(user.id_rol, 10);
	if (roleId === 1) {
		return next();
	}
	return res.status(403).json({ error: { message: 'Acceso restringido a administradores' }, data: {} });
};

module.exports = {
	verifyToken,
	assertSelfUser,
	assertAdmin,
};
