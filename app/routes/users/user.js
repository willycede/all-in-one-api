const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const twoFactorController = require('../../controllers/twoFactorController');
const userPreferencesController = require('../../controllers/userPreferencesController');
const { verifyToken, assertSelfUser } = require('../../middleware/auth');
const { rateLimit } = require('../../middleware/rateLimit');

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: 'auth' });

router.post("/register", userController.createUser);
router.post("/login", authRateLimit, userController.login);
router.post("/loginAdmin", authRateLimit, userController.loginAdmin);
router.post("/2fa/verify-login", authRateLimit, twoFactorController.verifyLogin);
router.get('/preferences/:id_user', verifyToken, assertSelfUser, userPreferencesController.getPreferences);
router.put('/preferences', verifyToken, userPreferencesController.updatePreferences);
router.get('/2fa/status', verifyToken, twoFactorController.getStatus);
router.post('/2fa/setup', verifyToken, twoFactorController.setup);
router.post('/2fa/enable', verifyToken, twoFactorController.enable);
router.post('/2fa/disable', verifyToken, twoFactorController.disable);
router.get('/:id', userController.getUserById);
router.post("/update", userController.updateUserInfo);
router.post("/resetPassword", userController.resetPassword);
module.exports = router;