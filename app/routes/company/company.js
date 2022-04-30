const express = require('express')
const router = express.Router()
const companiesController = require('../../controllers/companyController')


router.get('/', companiesController.get_Company)
router.post('/create_company', companiesController.createCompany)
router.put('/update_company', companiesController.put_Company)
router.delete('/delete_company', companiesController.delete_Company)


module.exports = router;