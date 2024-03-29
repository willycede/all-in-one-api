const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController')

router.post("/register", userController.createUser);
router.post("/login", userController.login);
router.post("/loginAdmin", userController.loginAdmin);
router.get('/:id', userController.getUserById);
router.post("/update", userController.updateUserInfo);
router.post("/resetPassword", userController.resetPassword);
module.exports = router;