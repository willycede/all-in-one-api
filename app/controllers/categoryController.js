const categoryModel = require('../models/category')
const response = require('../config/response');

const getCategoriesByCompanyId = async(req,res)=>{
    try {
        const id_company = req.params.company_id
        let errorMessage=''
        if(id_company == null || id_company==undefined || id_company ==''){
            errorMessage='El id de compañia no puede ser nulo o vacio'
            return response.error(req,res,{message:errorMessage, validationObject}, 422)
        }
        const categories = await categoryModel.getCategoriesByCompanyId({id_company})
        return response.success(req,res,categories,200)
    } catch (error) {
        return response.error(req,res,{message:`getStatesByCountryId: ${error.message}`},422)
    }
}
const createCategory = async (req,res) => {
    try {
        const body = req.body;
        const validatedData = await categoryModel.validateCategoryData({body});
        if(Object.entries(validatedData.validationObject).length>0 || validatedData.errorMessage ){
            return response.error(req,res,{message: validatedData.errorMessage, validationObject: validatedData.validationObject}, 422);
        }
        const createdCategory = await categoryModel.createCategoryLogic(body);
        return response.success(req, res, createdCategory, 200);
    } catch (error) {
        return response.error(req,res,{message:`createCategory: ${error.message}`},422);
    }
}
const updateCategory = async (req,res) => {
    try {
        const id_category = parseInt(req.params.id_category);
        const body = req.body;
        let errorMessage='';
        if(!id_category){
            errorMessage='El id de la categoría no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        const validatedData = await categoryModel.validateCategoryData({body, isCreate: false});
        if(Object.entries(validatedData.validationObject).length>0 || validatedData.errorMessage ){
            return response.error(req,res,{message: validatedData.errorMessage, validationObject: validatedData.validationObject}, 422);
        }
        const updatedCategory = await categoryModel.updateCategoryLogic(body, id_category);
        return response.success(req, res, updatedCategory, 200);
    } catch (error) {
        return response.error(req,res,{message:`updateCategory: ${error.message}`},422);
    }
}
const deleteCategory = async (req,res) => {
    try {
        const id_category = parseInt(req.params.id_category);
        let errorMessage='';
        if(!id_category){
            errorMessage='El id de la categoría no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        const category = await categoryModel.deleteCategory(id_category);
        return response.success(req, res, category, 200);
    } catch (error) {
        return response.error(req,res,{message:`deleteCategory: ${error.message}`},422);
    }
}
module.exports = {
    getCategoriesByCompanyId,
    createCategory,
    updateCategory,
    deleteCategory,
}