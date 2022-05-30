const userrolModel = require('../models/user_rol')
const response = require('../config/response');


const createUserRolController = async (req, res) => {
   
    let validationObject ={}
    try {

        const id_rol = req.body.id_rol;
        const id_company_user = req.body.id_company_user;
        
        const createdUserRol = await userrolModel.createUserRol(
           
            id_rol, id_company_user
            
        );
        return response.success(req, res, createdUserRol, 200);

    } catch (error) {
        return response.error(req, res, { message: `createdUserRol: ${error.message}` }, 422)
        return response.error(req, res, { message: `createdUserRol: ${error.message}` }, 422)
    }

};


const get_UserRols = async (req, res) => {
    try {
     
        const useroles = await userrolModel.getUseRol()
        return response.success(req, res, useroles, 200)

    } catch (error) {
        return response.error(req, res, { message: `get_UserRols: ${error.message}` }, 422)
    }
}

/*
const put_Rol = async (req, res) => {
    try {

        const body = req.body;
     
        const rolUp = await rolModel.putRolUpdate({
            body
        })

        return response.success(req, res, rolUp, 200)
        
    } catch (error) {
        return response.error(req, res, { message: `put_Rol: ${error.message}` }, 422)
    }
}

const delete_rol_Company = async (req, res) => {
    try {

        const id_rol = req.body.id_rol;
     
        const rolDelete = await rolModel.deleteRol({id_rol})

        return response.success(req, res, rolDelete, 200)
        
    } catch (error) {
        return response.error(req, res, { message: `rolDelete: ${error.message}` }, 422)
    }
}
*/
module.exports = {
    createUserRolController,get_UserRols,//delete_rol_Company,put_Rol,
}