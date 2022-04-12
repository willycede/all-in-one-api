const express = require('express')
const router = express.Router()
const companiesController = require('../../controllers/companyController')


router.get('/', companiesController.get_Company)
router.post('/create_company', companiesController.createCompany)


module.exports = router;