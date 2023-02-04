const express = require('express');
const router = express.Router();
const generalCategoriesController = require('../../controllers/generalCategoriesController')

router.get("/getGeneralCategories", generalCategoriesController.getGeneralCategories);
module.exports = router;