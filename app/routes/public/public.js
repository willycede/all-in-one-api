const express = require('express');
const router = express.Router();
const publicContentController = require('../../controllers/publicContentController');

router.get('/contact', publicContentController.getContact);
router.get('/privacy-policy', publicContentController.getPrivacyPolicy);
router.get('/terms', publicContentController.getTerms);
router.get('/faq', publicContentController.getFaq);

module.exports = router;
