const PermissionModel =  require("../models/permission");
const response = require('../config/response');
const createPermission = async (req,res) => {
    try {
        const body = req.body;
        const validatedData = await PermissionModel.validatePermissionData({body});
        if(Object.entries(validatedData.validationObject).length>0 || validatedData.errorMessage ){
            return response.error(req,res,{message: validatedData.errorMessage, validationObject: validatedData.validationObject}, 422);
        }
        const createdPermission = await PermissionModel.createPermissionLogic(body);
        return response.success(req, res, createdPermission, 200);
    } catch (error) {
        return response.error(req,res,{message:`createPermission: ${error.message}`},422);
    }
    
}
const getPermission = async (req,res) => {
    try {
        let id_rol = parseInt(req.query.id_rol);
        let errorMessage='';
        if(!id_rol){
            errorMessage='El id rol no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        const permissions = await PermissionModel.getPermissionsByRolId({id_rol});
        return response.success(req,res,permissions,200);
    } catch (error) {
        return response.error(req,res,{message:`getPermission: ${error.message}`},422);
    }
}
const updatePermission = async (req,res) => {
    try {
        const id_permission = parseInt(req.params.id_permission);
        const body = req.body;
        let errorMessage='';
        if(!id_permission){
            errorMessage='El id del permission no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        const validatedData = await PermissionModel.validatePermissionData({body, isCreate: false});
        if(Object.entries(validatedData.validationObject).length>0 || validatedData.errorMessage ){
            return response.error(req,res,{message: validatedData.errorMessage, validationObject: validatedData.validationObject}, 422);
        }
        const updatedPermission = await PermissionModel.updatePermissionLogic(body, id_permission);
        return response.success(req, res, updatedPermission, 200);
    } catch (error) {
        return response.error(req,res,{message:`updatePermission: ${error.message}`},422);
    }
}
const deletePermission = async (req,res) => {
    try {
        const id_permission = parseInt(req.params.id_permission);
        let errorMessage='';
        if(!id_permission){
            errorMessage='El id del permission no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        const premission = await PermissionModel.deletePermission(id_permission);
        return response.success(req, res, premission, 200);
    } catch (error) {
        return response.error(req,res,{message:`deletePermission: ${error.message}`},422);
    }
}
module.exports = {
    createPermission,
    getPermission,
    updatePermission,
    deletePermission
}
