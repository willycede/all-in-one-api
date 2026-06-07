const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination(req, file, cb) {
		cb(null, uploadDir);
	},
	filename(req, file, cb) {
		const productId = req.params.product_id || 'new';
		const timestamp = Date.now();
		const ext = path.extname(file.originalname).toLowerCase();
		const sanitized = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
		cb(null, `${productId}-${timestamp}-${sanitized}${ext}`);
	},
});

const fileFilter = (req, file, cb) => {
	const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
	if (allowed.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error('Solo se aceptan imágenes JPG, PNG o WEBP'), false);
	}
};

module.exports = multer({
	storage,
	fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 },
});
