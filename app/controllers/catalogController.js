const catalogModel =  require("../models/catalog");
const response = require('../config/response');
const createCatalog = async (req,res) => {
    try {
        const body = req.body;
        const validatedData = await catalogModel.validateCatalogData({body});
        if(Object.entries(validatedData.validationObject).length>0 || validatedData.errorMessage ){
            return response.error(req,res,{message: validatedData.errorMessage, validationObject: validatedData.validationObject}, 422);
        }
        const createdCatalog = await catalogModel.createCatalogLogic(body);
        return response.success(req, res, createdCatalog, 200);
    } catch (error) {
        return response.error(req,res,{message:`createCatalog: ${error.message}`},422);
    }
    
}
const getCatalogs = async (req,res) => {
    try {
        const catalogs = await catalogModel.getCatalogs();
        return response.success(req,res,catalogs,200);
    } catch (error) {
        return response.error(req,res,{message:`getCatalogs: ${error.message}`},422);
    }
}
const updateCatalog = async (req,res) => {
    try {
        const id_catalog = parseInt(req.params.id_catalog);
        const body = req.body;
        let errorMessage='';
        if(!id_catalog){
            errorMessage='El id del catalogo no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        const validatedData = await catalogModel.validateCatalogData({body, isCreate: false});
        if(Object.entries(validatedData.validationObject).length>0 || validatedData.errorMessage ){
            return response.error(req,res,{message: validatedData.errorMessage, validationObject: validatedData.validationObject}, 422);
        }
        const updatedCatalog = await catalogModel.updateCatalogLogic(body, id_catalog);
        return response.success(req, res, updatedCatalog, 200);
    } catch (error) {
        return response.error(req,res,{message:`updateCatalog: ${error.message}`},422);
    }
}
const deleteCatalog = async (req,res) => {
    try {
        const id_catalog = parseInt(req.params.id_catalog);
        let errorMessage='';
        if(!id_catalog){
            errorMessage='El id del catalogo no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        const catalog = await catalogModel.deleteCatalog(id_catalog);
        return response.success(req, res, catalog, 200);
    } catch (error) {
        return response.error(req,res,{message:`deleteCatalog: ${error.message}`},422);
    }
}
module.exports = {
    createCatalog,
    getCatalogs,
    updateCatalog,
    deleteCatalog
}
