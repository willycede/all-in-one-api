const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const { rateLimit } = require('../../middleware/rateLimit');

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: 'auth' });

router.post("/register", userController.createUser);
router.post("/login", authRateLimit, userController.login);
router.post("/loginAdmin", authRateLimit, userController.loginAdmin);
router.get('/:id', userController.getUserById);
router.post("/update", userController.updateUserInfo);
router.post("/resetPassword", userController.resetPassword);
module.exports = router;