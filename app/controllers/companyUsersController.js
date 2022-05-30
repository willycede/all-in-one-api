const companyuserModel = require('../models/company_users')
const response = require('../config/response');


const createCompanyUsers = async (req, res) => {
    
    let validationObject ={}
    try {

        const id_company = req.body.id_company;
        const id_users = req.body.id_users;
        const status = req.body.status;

        const body = req.body;

        
        const validatedData = await companyuserModel.validateUserCompanyData({
            body
        });

        if (Object.entries(validatedData.validationObject).length > 0 || validatedData.errorMessage) {
            return response.error(req, res, { message: validatedData.errorMessage, validationObject: validatedData.validationObject }, 422);
        }
        
        const createdCompanyUser = await companyuserModel.createCompanyUser(
           
                id_company, id_users, status
            
        );
        return response.success(req, res, createdCompanyUser, 200);

    } catch (error) {
        return response.error(req, res, { message: `createdCompanyUserError: ${error.message}` }, 422)
        return response.error(req, res, { message: `createdCompanyUserError: ${error.message}` }, 422)
    }

};

const get_CompanyUser = async (req, res) => {
    try {
     
        const companiesUser = await companyuserModel.getCompanyUser()
        return response.success(req, res, companiesUser, 200)

    } catch (error) {
        return response.error(req, res, { message: `get_CompanyUser: ${error.message}` }, 422)
    }
}


const delete_CompanyUser = async (req, res) => {
    try {

        const id_company_user = req.body.id_company_user;
     
        const companyUsersDelete = await companyuserModel.deleteCompanyUsers({id_company_user})

        return response.success(req, res, companyUsersDelete, 200)
        
    } catch (error) {
        return response.error(req, res, { message: `delete_CompanyUser: ${error.message}` }, 422)
    }
}

module.exports = {
    get_CompanyUser,createCompanyUsers,delete_CompanyUser
}