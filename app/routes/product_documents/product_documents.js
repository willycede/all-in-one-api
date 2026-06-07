const express = require('express');
const router = express.Router();
const cartDetailDocumentsController = require('../../controllers/cartDetailDocumentsController');
const upload = require('../../config/multerConfig');
const { verifyToken, assertSelfUser, assertAdmin } = require('../../middleware/auth');

router.get(
	'/admin/review',
	verifyToken,
	assertAdmin,
	cartDetailDocumentsController.getDocumentsForAdminReview
);

router.get(
	'/cart-detail/:cart_detail_id',
	verifyToken,
	cartDetailDocumentsController.getDocumentsByCartDetail
);

router.post(
	'/upload-file',
	verifyToken,
	upload.single('document'),
	cartDetailDocumentsController.uploadDocumentWithFile
);

router.post('/upload', verifyToken, cartDetailDocumentsController.uploadDocument);

router.get(
	'/validate/cart-detail/:cart_detail_id',
	verifyToken,
	cartDetailDocumentsController.validateDocuments
);

router.put(
	'/:document_id/verify',
	verifyToken,
	assertAdmin,
	cartDetailDocumentsController.updateVerification
);

router.delete(
	'/:document_id',
	verifyToken,
	cartDetailDocumentsController.deleteDocument
);

module.exports = router;
