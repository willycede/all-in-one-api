const productModel = require('../models/products')
const response = require('../config/response');

const getProductsByCategoryId = async(req,res)=>{
    try {
        const category_id = req.params.category_id
        let errorMessage=''
        if(category_id == null || category_id==undefined || category_id ==''){
            errorMessage='El id de categoría no puede ser nulo o vacio'
            return response.error(req,res,{message:errorMessage, validationObject}, 422)
        }
        const products = await productModel.getProductsByCategoryId({category_id})
        return response.success(req,res,products,200)
    } catch (error) {
        return response.error(req,res,{message:`getProductsByCategoryId: ${error.message}`},422)
    }
}
const getProductsByProductId = async(req,res)=>{
    try {
        const product_id = req.params.product_id
        let errorMessage=''
        if(product_id == null || product_id==undefined || product_id ==''){
            errorMessage='El id de producto no puede ser nulo o vacio'
            return response.error(req,res,{message:errorMessage, validationObject}, 422)
        }
        const product = await productModel.getProductsByProductId({product_id})
        return response.success(req,res,product,200)
    } catch (error) {
        return response.error(req,res,{message:`getProductByProviderId: ${error.message}`},422)
    }
}
module.exports = {
    getProductsByCategoryId,
    getProductsByProductId
}