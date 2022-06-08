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
const CreateProducts = async (req, res) => {
    
    let validationObject ={}
    try {

        const id_cod_catalog = req.body.id_cod_catalog;
        const cod_products = req.body.cod_products;
        const name = req.body.name;
        const description = req.body.description;
        const price = req.body.price
        const discount = req.body.discount
        const id_category = req.body.id_category
        const external_product_id = req.body.external_product_id

        const body = req.body;
        
        const validatedData = await productModel.validateExistProduct({
            body
        });
        
        if (Object.entries(validatedData.validationObject).length > 0 || validatedData.errorMessage) {
            return response.error(req, res, { message: validatedData.errorMessage, validationObject: validatedData.validationObject }, 422);
        }
        
        const createdProduct = await productModel.RegistraProductModel({
            body
        });

        return response.success(req, res, createdProduct, 200);

    } catch (error) {
        return response.error(req, res, { message: `createdProductError: ${error.message}` }, 422)
        return response.error(req, res, { message: `createdProductError: ${error.message}` }, 422)
    }

};

const putProduct = async (req, res) => {
    
    let validationObject ={}
    try {

        const body = req.body;
        
        const updateProduct = await productModel.putProductsUpdate({
            body
        });

        return response.success(req, res, updateProduct, 200);

    } catch (error) {
        return response.error(req, res, { message: `putProductError: ${error.message}` }, 422)
        return response.error(req, res, { message: `putProductError: ${error.message}` }, 422)
    }

};




module.exports = {
    getProductsByCategoryId,
    getProductsByProductId,
    CreateProducts,
    putProduct,
}