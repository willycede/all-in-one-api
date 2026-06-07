const express = require('express');
const router = express.Router();
const legalDocumentController = require('../../controllers/legalDocumentController');

router.get('/active', legalDocumentController.listActive);
router.get('/file/:document_key', legalDocumentController.downloadFile);
router.post('/consents', legalDocumentController.createConsent);
router.get('/consents/:id', legalDocumentController.getUserConsents);

module.exports = router;
