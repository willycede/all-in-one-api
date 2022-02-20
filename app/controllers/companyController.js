const companyModel = require('../models/companies')
const response = require('../config/response');

const getCompanies = async(req,res)=>{
    try {
        const companies = await companyModel.getCompanies() 
        return response.success(req,res,companies,200)
    } catch (error) {
        return response.error(req,res,{message:`getCompanies: ${error.message}`},422)
    }
}
module.exports = {
    getCompanies,
}