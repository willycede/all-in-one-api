const express = require('express')
const router = express.Router()
const userrolController = require('../../controllers/userrolController')


router.get('/', userrolController.get_UserRols)
router.post('/create_userrol', userrolController.createUserRolController)
//router.put('/update_userrol', userrolController.put_Rol)
//router.delete('/delete_userrol', userrolController.delete_rol_Company)





module.exports = router;