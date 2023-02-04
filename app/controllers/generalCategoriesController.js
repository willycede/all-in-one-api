const generalCategoriesModel = require('../models/general_categories')
const response = require('../config/response');

const getGeneralCategories = async(req,res)=>{
    try {
        const generalCategories = await generalCategoriesModel.getGeneralCategories();
        return response.success(req,res,generalCategories,200)
    } catch (error) {
        return response.error(req,res,{message:`getGeneralCategories: ${error.message}`},422)
    }
}
module.exports = {
    getGeneralCategories,
}