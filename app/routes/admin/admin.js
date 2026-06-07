const express = require('express');
const router = express.Router();
const { verifyToken, assertAdmin } = require('../../middleware/auth');
const adminDashboardController = require('../../controllers/adminDashboardController');
const adminCollaboratorsController = require('../../controllers/adminCollaboratorsController');

router.get('/dashboard/stats', verifyToken, assertAdmin, adminDashboardController.getDashboardStats);
router.post('/collaborators', verifyToken, assertAdmin, adminCollaboratorsController.inviteCollaborator);

module.exports = router;
