const companyModel = require('../models/company')
const response = require('../config/response');


const createCompany = async (req, res) => {
    let validationObject ={}
    try {

        const body = req.body;
        
        const validatedData = await companyModel.validateCompanyData({
            body
        });

        if (Object.entries(validatedData.validationObject).length > 0 || validatedData.errorMessage) {
            return response.error(req, res, { message: validatedData.errorMessage, validationObject: validatedData.validationObject }, 422);
        }
        const createdCompany = await companyModel.createCompanyMetodo(
            {
                body
            }
        );
        return response.success(req, res, createdCompany, 200);
    } catch (error) {
        return response.error(req, res, { message: `createdCompanyError: ${error.message}`, validationObject }, 422)
        return response.error(req, res, { message: `createdCompanyError: ${error.message}` }, 422)
    }

};

const get_Company = async (req, res) => {
    try {
     
        const companies = await companyModel.getCompany()
        return response.success(req, res, companies, 200)

    } catch (error) {
        return response.error(req, res, { message: `getCompanies: ${error.message}` }, 422)
    }
}

const put_Company = async (req, res) => {
    try {

        const body = req.body;
     
        const companiesUp = await companyModel.putCompanyUpdate({
            body
        })

        return response.success(req, res, companiesUp, 200)
        
    } catch (error) {
        return response.error(req, res, { message: `putCompanyUpdate: ${error.message}` }, 422)
    }
}



const delete_Company = async (req, res) => {
    try {

        const id_company = req.body.id_company;
     
        const companiesDelete = await companyModel.deleteCompany({id_company})

        return response.success(req, res, companiesDelete, 200)
        
    } catch (error) {
        return response.error(req, res, { message: `deleteCompany: ${error.message}` }, 422)
    }
}

module.exports = {
    get_Company,createCompany,put_Company,delete_Company,
}