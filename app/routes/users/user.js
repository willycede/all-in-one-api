const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController')
router.post("/login", userController.login);
router.post("/register", userController.createUser);
router.put('/update', userController.updateUser)
router.delete('/delete', userController.deleteUser)
router.get("/:id", userController.getUsersByCompany);
module.exports = router;