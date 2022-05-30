const rolModel = require('../models/rol')
const response = require('../config/response');


const createRolController = async (req, res) => {
   
    let validationObject ={}
    try {

        const name = req.body.name;
        const description = req.body.description;
        const status = req.body.status;

        /*
        const body = req.body;

        
        const validatedData = await companyuserModel.validateUserCompanyData({
            body
        });

        if (Object.entries(validatedData.validationObject).length > 0 || validatedData.errorMessage) {
            return response.error(req, res, { message: validatedData.errorMessage, validationObject: validatedData.validationObject }, 422);
        }
        */
        
        const createdRol = await rolModel.createRol(
           
            name, description, status
            
        );
        return response.success(req, res, createdRol, 200);

    } catch (error) {
        return response.error(req, res, { message: `createdRol: ${error.message}` }, 422)
        return response.error(req, res, { message: `createdRol: ${error.message}` }, 422)
    }

};


const get_Rols = async (req, res) => {
    try {
     
        const roles = await rolModel.getRol()
        return response.success(req, res, roles, 200)

    } catch (error) {
        return response.error(req, res, { message: `get_Rols: ${error.message}` }, 422)
    }
}

/*
const put_Company = async (req, res) => {
    try {

        const body = req.body;
     
        const companiesUp = await rolModel.putCompanyUpdate({
            body
        })

        return response.success(req, res, companiesUp, 200)
        
    } catch (error) {
        return response.error(req, res, { message: `putCompanyUpdate: ${error.message}` }, 422)
    }
}
*/
const delete_rol_Company = async (req, res) => {
    try {

        const id_rol = req.body.id_rol;
     
        const rolDelete = await rolModel.deleteRol({id_rol})

        return response.success(req, res, rolDelete, 200)
        
    } catch (error) {
        return response.error(req, res, { message: `rolDelete: ${error.message}` }, 422)
    }
}

module.exports = {
    createRolController,get_Rols,delete_rol_Company,
}