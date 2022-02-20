const categoryModel = require('../models/categories')
const response = require('../config/response');

const getCategoriesByCompanyId = async(req,res)=>{
    try {
        const company_id = req.params.company_id
        let errorMessage=''
        if(company_id == null || company_id==undefined || company_id ==''){
            errorMessage='El id de compañia no puede ser nulo o vacio'
            return response.error(req,res,{message:errorMessage, validationObject}, 422)
        }
        const categories = await categoryModel.getCategoriesByCompanyId({company_id})
        return response.success(req,res,categories,200)
    } catch (error) {
        return response.error(req,res,{message:`getStatesByCountryId: ${error.message}`},422)
    }
}
module.exports = {
    getCategoriesByCompanyId,
}