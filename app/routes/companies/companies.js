const express = require('express')
const router = express.Router()
const companiesController = require('../../controllers/companyController')

router.get('/', companiesController.getCompanies)


module.exports = router;