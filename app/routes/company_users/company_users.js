const express = require('express')
const router = express.Router()
const companiesUsersController = require('../../controllers/companyUsersController')


router.get('/', companiesUsersController.get_CompanyUser)
router.post('/create_company_users', companiesUsersController.createCompanyUsers)
//router.put('/update_company', companiesUsersController.put_Company)
//router.delete('/delete_company', companiesUsersController.delete_Company)





module.exports = router;