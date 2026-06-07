const express = require('express');
const router = express.Router();
const { verifyToken, assertAdmin } = require('../../middleware/auth');
const adminDashboardController = require('../../controllers/adminDashboardController');
const adminCollaboratorsController = require('../../controllers/adminCollaboratorsController');
const adminInvoicesController = require('../../controllers/adminInvoicesController');
const adminOrdersController = require('../../controllers/adminOrdersController');
const adminBillingController = require('../../controllers/adminBillingController');
const uploadBillingSignature = require('../../config/multerBillingSignature');

router.get('/dashboard/stats', verifyToken, assertAdmin, adminDashboardController.getDashboardStats);
router.get('/orders', verifyToken, assertAdmin, adminOrdersController.listOrders);
router.post('/orders/:id_shopping_car/cancel', verifyToken, assertAdmin, adminOrdersController.cancelOrder);
router.get('/invoices', verifyToken, assertAdmin, adminInvoicesController.listInvoices);
router.post('/invoices/:id_shopping_car/reprocess', verifyToken, assertAdmin, adminInvoicesController.reprocessInvoice);
router.get('/invoices/:id_shopping_car/download/:type', verifyToken, assertAdmin, adminInvoicesController.downloadInvoiceFile);
router.get('/billing/settings', verifyToken, assertAdmin, adminBillingController.getSettings);
router.put('/billing/settings', verifyToken, assertAdmin, adminBillingController.updateSettings);
router.post(
	'/billing/signature',
	verifyToken,
	assertAdmin,
	uploadBillingSignature.single('signature'),
	adminBillingController.uploadSignature
);
router.post('/collaborators', verifyToken, assertAdmin, adminCollaboratorsController.inviteCollaborator);

module.exports = router;
