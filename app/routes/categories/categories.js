const express = require('express')
const router = express.Router()
const categoryController = require('../../controllers/categoryController')

router.get('/:company_id', categoryController.getCategoriesByCompanyId)


module.exports = router;