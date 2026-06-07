const productModel = require('../models/products')
const citiesModel = require('../models/cities')
const response = require('../config/response');

const attachImagesToProducts = async (products) => {
	for (const product of products) {
		const listImages = await productModel.getListImagesByProductId(product.id_products);
		product.images = listImages;
	}
	return products;
};

const getProductsByCategoryId = async(req,res)=>{
    try {
        const query = req.query;
        let category_id = req.params.category_id;

        if (!category_id || category_id === 'undefined') {
            category_id = null;
        }

        const result = await productModel.getProductsPaginated({
            categoryId: category_id,
            searchBy: query.searchBy,
            page: query.page,
            limit: query.limit,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
            cityId: query.cityId,
            sortBy: query.sortBy,
        });

        result.items = await attachImagesToProducts(result.items);
        return response.success(req, res, result, 200);

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
        const editData = await productModel.getProductEditData(product_id);
        const responseProduct = editData ? [editData] : product;
        const listImages = editData && editData.images ? editData.images : await productModel.getListImagesByProductId(product[0].id_products);
        if (responseProduct[0]) {
            responseProduct[0].images = listImages;
        }
        
        // Validate and fetch allowed cities if the field has a value
        if(responseProduct[0].allowed_cities && responseProduct[0].allowed_cities.trim() !== '') {
            const cityIdsArray = responseProduct[0].allowed_cities.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            if(cityIdsArray.length > 0) {
                const cities = await citiesModel.getCitiesByIds(cityIdsArray);
                responseProduct[0].cities = cities;
            }
        }
        
        // Parse and return required_documents as an array
        if(responseProduct[0].required_documents && responseProduct[0].required_documents.trim() !== '') {
            responseProduct[0].required_documents_array = responseProduct[0].required_documents
                .split(',')
                .map(doc => doc.trim())
                .filter(doc => doc !== '');
            responseProduct[0].required_documents_count = responseProduct[0].required_documents_array.length;
        } else {
            responseProduct[0].required_documents_array = [];
            responseProduct[0].required_documents_count = 0;
        }
        
        return response.success(req,res,responseProduct,200)
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
    try {
        const body = req.body;

        const validatedData = await productModel.validateUpdateProduct({ body });
        if (Object.entries(validatedData.validationObject).length > 0 || validatedData.errorMessage) {
            return response.error(req, res, {
                message: validatedData.errorMessage || 'Datos de producto inválidos',
                validationObject: validatedData.validationObject,
            }, 422);
        }

        const updateProduct = await productModel.putProductsUpdate({ body });
        return response.success(req, res, updateProduct, 200);
    } catch (error) {
        return response.error(req, res, { message: `putProductError: ${error.message}` }, 422);
    }
};

const uploadProductImage = async (req, res) => {
    try {
        const productId = parseInt(req.params.product_id, 10);
        if (!productId) {
            return response.error(req, res, { message: 'ID de producto inválido' }, 422);
        }

        const product = await productModel.getProductsByProductId(productId);
        if (!product || product.length === 0) {
            return response.error(req, res, { message: 'Producto no encontrado' }, 422);
        }

        if (!req.file) {
            return response.error(req, res, { message: 'No se recibió ninguna imagen' }, 422);
        }

        const imageUrl = `/uploads/products/${req.file.filename}`;
        const imageName = req.body.name || req.file.originalname || 'image';
        const order = parseInt(req.body.order, 10) || 0;
        const created = await productModel.addProductImage(productId, imageUrl, imageName, order);

        return response.success(req, res, created, 200);
    } catch (error) {
        return response.error(req, res, { message: `uploadProductImage: ${error.message}` }, 422);
    }
};

const deleteProductImage = async (req, res) => {
    try {
        const productId = parseInt(req.params.product_id, 10);
        const imageId = parseInt(req.params.image_id, 10);

        const deleted = await productModel.deleteProductImage(imageId, productId);
        if (!deleted) {
            return response.error(req, res, { message: 'Imagen no encontrada' }, 422);
        }

        return response.success(req, res, { deleted: true }, 200);
    } catch (error) {
        return response.error(req, res, { message: `deleteProductImage: ${error.message}` }, 422);
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
    uploadProductImage,
    deleteProductImage,
}