const featureModel =  require("../models/features");
const response = require('../config/response');
const createFeature = async (req,res) => {
    try {
        const body = req.body;
        const validatedData = await featureModel.validateFeatureData({body});
        if(Object.entries(validatedData.validationObject).length>0 || validatedData.errorMessage ){
            return response.error(req,res,{message: validatedData.errorMessage, validationObject: validatedData.validationObject}, 422);
        }
        const createdFeature = await featureModel.createFeatureLogic(body);
        return response.success(req, res, createdFeature, 200);
    } catch (error) {
        return response.error(req,res,{message:`createFeature: ${error.message}`},422);
    }
    
}
const getFeatures = async (req,res) => {
    try {
        const features = await featureModel.getFeatures();
        return response.success(req,res,features,200);
    } catch (error) {
        return response.error(req,res,{message:`getFeatures: ${error.message}`},422);
    }
}
const updateFeature = async (req,res) => {
    try {
        const id_products = parseInt(req.params.id_products);
        const id_category = parseInt(req.params.id_category);
        const id_catalogo = parseInt(req.params.id_catalogo);
        const body = req.body;
        let errorMessage='';
        if(!id_products){
            errorMessage='El id del producto no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        if(!id_category){
            errorMessage='El id de la categoría no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        if(!id_catalogo){
            errorMessage='El id del catalogo no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        const validatedData = await featureModel.validateFeatureData({body, isCreate: false});
        if(Object.entries(validatedData.validationObject).length>0 || validatedData.errorMessage ){
            return response.error(req,res,{message: validatedData.errorMessage, validationObject: validatedData.validationObject}, 422);
        }
        const updatedFeature = await featureModel.updateFeatureLogic(body, id_products, id_category, id_catalogo);
        return response.success(req, res, updatedFeature, 200);
    } catch (error) {
        return response.error(req,res,{message:`updateFeature: ${error.message}`},422);
    }
}
const deleteFeature = async (req,res) => {
    try {
        const id_products = parseInt(req.params.id_products);
        const id_category = parseInt(req.params.id_category);
        const id_catalogo = parseInt(req.params.id_catalogo);
        let errorMessage='';
        if(!id_products){
            errorMessage='El id del producto no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        if(!id_category){
            errorMessage='El id de la categoría no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        if(!id_catalogo){
            errorMessage='El id del catalogo no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        const feature = await featureModel.deleteFeature(id_products, id_category, id_catalogo);
        return response.success(req, res, feature, 200);
    } catch (error) {
        return response.error(req,res,{message:`deleteFeature: ${error.message}`},422);
    }
}
module.exports = {
    createFeature,
    getFeatures,
    updateFeature,
    deleteFeature
}
