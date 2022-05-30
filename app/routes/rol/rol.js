const express = require('express')
const router = express.Router()
const rolController = require('../../controllers/rolController')


router.get('/', rolController.get_Rols)
router.post('/create_rol', rolController.createRolController)
//router.put('/update_company', companiesUsersController.put_Company)
router.delete('/delete_rol', rolController.delete_rol_Company)





module.exports = router;