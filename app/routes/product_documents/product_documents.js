const express = require('express');
const router = express.Router();
const cartDetailDocumentsController = require('../../controllers/cartDetailDocumentsController');
const upload = require('../../config/multerConfig');

// Get all documents for a cart detail
router.get('/cart-detail/:cart_detail_id', cartDetailDocumentsController.getDocumentsByCartDetail);

// Upload a new document with file (saves to server)
router.post('/upload-file', upload.single('document'), cartDetailDocumentsController.uploadDocumentWithFile);

// Upload a new document (legacy - with external URL)
router.post('/upload', cartDetailDocumentsController.uploadDocument);

// Validate documents for a cart detail
router.get('/validate/cart-detail/:cart_detail_id', cartDetailDocumentsController.validateDocuments);

// Update document verification status
router.put('/:document_id/verify', cartDetailDocumentsController.updateVerification);

// Delete a document
router.delete('/:document_id', cartDetailDocumentsController.deleteDocument);

module.exports = router;
