const productModel = require('../models/products')
const response = require('../config/response');
const { off } = require('npm');

const getProductsByCategoryId = async(req,res)=>{
    try {
        const query = req.query;
        let category_id = req.params.category_id;
        let products;
        if(!category_id || category_id === 'undefined'){
            products = await productModel.getAllProducts(query);
        }else {
            category_id = parseInt(category_id);
            products = await productModel.getProductsByGeneralCategoryId(category_id, query);
        }
        if (query.searchBy){
            const regexText = new RegExp(query.searchBy.toLowerCase() || '');
            products = products.filter(product => regexText.test(product.name.toLowerCase()));
        }
     
        for (const product of products) {
            const listImages = await productModel.getListImagesByProductId(product.id_products);
            product.images = listImages;
        }
        return response.success(req,res,products,200)

    } catch (error) {
        return response.error(req,res,{message:`getProductsByCategoryId: ${error.message}`},422)
    }
}
const getProductsByProductId = async(req,res)=>{
    try {

        let validationObject ={}
        const product_id = req.params.product_id
        
        let errorMessage=''
        if(product_id == null || product_id==undefined || product_id =='' || product_id == 0){

            errorMessage='El id de producto no puede ser nulo,vacio o cero'
            return response.error(req,res,{message:errorMessage, validationObject}, 422)
        }
        const product = await productModel.getProductsByProductId(product_id);
        if(!product || (product && product.length ===0) ){
            errorMessage='El id de producto no se encuentra registrado';
            return response.error(req,res,{message:errorMessage, validationObject}, 422)
        }
        const listImages = await productModel.getListImagesByProductId(product[0].id_products);
        product[0].images = listImages;
        
        return response.success(req,res,product,200)
    } catch (error) {
        return response.error(req,res,{message:`getProductsByProductId: ${error.message}`},422)
    }
}
const CreateProducts = async (req, res) => {
    try {

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
    }

};


const getRandomProducts = async(req,res)=>{
    try {
        const products = await productModel.getRandomProducts();
        for (const product of products) {
            const listImages = await productModel.getListImagesByProductId(product.id_products);
            product.images = listImages;
        }
        return response.success(req,res,products,200)
    } catch (error) {
        return response.error(req,res,{message:`getRamdomProducts: ${error.message}`},422)
    }
}

module.exports = {
    getProductsByCategoryId,
    getProductsByProductId,
    CreateProducts,
    putProduct,
    getRandomProducts,
}