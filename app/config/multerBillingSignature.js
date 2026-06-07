const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/billing');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination(_req, _file, cb) {
		cb(null, uploadDir);
	},
	filename(_req, file, cb) {
		const ext = path.extname(file.originalname).toLowerCase();
		cb(null, `signature-${Date.now()}${ext || '.p12'}`);
	},
});

const fileFilter = (_req, file, cb) => {
	const allowed = ['.p12', '.pfx', '.pem'];
	const ext = path.extname(file.originalname).toLowerCase();
	if (allowed.includes(ext)) {
		cb(null, true);
		return;
	}
	cb(new Error('Solo se permiten archivos de firma (.p12, .pfx, .pem)'), false);
};

module.exports = multer({
	storage,
	fileFilter,
	limits: { fileSize: 2 * 1024 * 1024 },
});
