const buckets = new Map();

const rateLimit = ({ windowMs = 60000, max = 60, keyPrefix = '' } = {}) => (req, res, next) => {
	const ip = req.ip || req.connection.remoteAddress || 'unknown';
	const key = `${keyPrefix}:${ip}`;
	const now = Date.now();
	let bucket = buckets.get(key);

	if (!bucket || now - bucket.start > windowMs) {
		bucket = { start: now, count: 0 };
		buckets.set(key, bucket);
	}

	bucket.count += 1;

	if (bucket.count > max) {
		return res.status(429).json({
			error: { message: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' },
			data: {},
		});
	}

	return next();
};

module.exports = {
	rateLimit,
};
