const express = require('express');
const router = express.Router();
const { verifyToken, assertAdmin } = require('../../middleware/auth');
const adminDashboardController = require('../../controllers/adminDashboardController');
const adminCollaboratorsController = require('../../controllers/adminCollaboratorsController');
const adminInvoicesController = require('../../controllers/adminInvoicesController');

router.get('/dashboard/stats', verifyToken, assertAdmin, adminDashboardController.getDashboardStats);
router.get('/invoices', verifyToken, assertAdmin, adminInvoicesController.listInvoices);
router.post('/invoices/:id_shopping_car/reprocess', verifyToken, assertAdmin, adminInvoicesController.reprocessInvoice);
router.post('/collaborators', verifyToken, assertAdmin, adminCollaboratorsController.inviteCollaborator);

module.exports = router;
