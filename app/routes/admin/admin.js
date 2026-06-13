const express = require('express');
const router = express.Router();
const { verifyToken, assertAdmin } = require('../../middleware/auth');
const adminDashboardController = require('../../controllers/adminDashboardController');
const adminCollaboratorsController = require('../../controllers/adminCollaboratorsController');
const adminInvoicesController = require('../../controllers/adminInvoicesController');
const adminOrdersController = require('../../controllers/adminOrdersController');
const adminBillingController = require('../../controllers/adminBillingController');
const adminUsersController = require('../../controllers/adminUsersController');
const adminAuditLogsController = require('../../controllers/adminAuditLogsController');
const uploadBillingSignature = require('../../config/multerBillingSignature');

router.get('/dashboard/stats', verifyToken, assertAdmin, adminDashboardController.getDashboardStats);
router.get('/orders', verifyToken, assertAdmin, adminOrdersController.listOrders);
router.post('/orders/:id_shopping_car/cancel', verifyToken, assertAdmin, adminOrdersController.cancelOrder);
router.get('/invoices/alerts', verifyToken, assertAdmin, adminInvoicesController.getInvoiceAlerts);
router.get('/invoices', verifyToken, assertAdmin, adminInvoicesController.listInvoices);
router.post('/invoices/:id_shopping_car/reprocess', verifyToken, assertAdmin, adminInvoicesController.reprocessInvoice);
router.get('/invoices/:id_shopping_car/download/:type', verifyToken, assertAdmin, adminInvoicesController.downloadInvoiceFile);
router.get('/billing/settings', verifyToken, assertAdmin, adminBillingController.getSettings);
router.get('/billing/invoice-diagnostics', verifyToken, assertAdmin, adminBillingController.getInvoiceDiagnostics);
router.put('/billing/settings', verifyToken, assertAdmin, adminBillingController.updateSettings);
router.post(
	'/billing/signature/validate',
	verifyToken,
	assertAdmin,
	uploadBillingSignature.single('signature'),
	adminBillingController.validateSignatureUpload
);
router.post(
	'/billing/signature',
	verifyToken,
	assertAdmin,
	uploadBillingSignature.single('signature'),
	adminBillingController.uploadSignature
);
router.post('/collaborators', verifyToken, assertAdmin, adminCollaboratorsController.inviteCollaborator);
router.get('/users', verifyToken, assertAdmin, adminUsersController.listUsers);
router.post('/users/:id_users/disable-2fa', verifyToken, assertAdmin, adminUsersController.disableUserTwoFactor);
router.patch('/users/:id_users/status', verifyToken, assertAdmin, adminUsersController.updateUserStatus);
router.get('/audit-logs', verifyToken, assertAdmin, adminAuditLogsController.listAuditLogs);
router.get('/audit-logs/event-types', verifyToken, assertAdmin, adminAuditLogsController.listEventTypes);

module.exports = router;
