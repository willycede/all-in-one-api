const locationModel =  require("../models/locations")
const createLocation = async (req,res) => {
    try {
        const body = req.body;
        const validatedData = locationModel.validateLocationData({body});
        if(Object.entries(validatedData.validationObject).length>0 || validatedData.errorMessage ){
            return response.error(req,res,{message: validatedData.errorMessage, validationObject: validatedData.validationObject}, 422);
        }
        const createdLocation = await locationModel.createLocationLogic(location);
        return response.success(req, res, createdLocation, 200);
    } catch (error) {
        return response.error(req,res,{message:`createLocation: ${error.message}`},422);
    }
    
}
const getLocations = async (req,res) => {
    try {
        const company_id = req.params.company_id;
        let errorMessage='';
        if(!company_id){
            errorMessage='El id de compañia no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        const locations = await locationModel.getLocationsByCompanyId({company_id});
        return response.success(req,res,locations,200);
    } catch (error) {
        return response.error(req,res,{message:`getLocations: ${error.message}`},422);
    }
}
const updateLocation = async (req,res) => {
    try {
        const location_id = req.params.location_id;
        let errorMessage='';
        if(!location_id){
            errorMessage='El id de la localidad no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        const validatedData = locationModel.validateLocationData({body});
        if(Object.entries(validatedData.validationObject).length>0 || validatedData.errorMessage ){
            return response.error(req,res,{message: validatedData.errorMessage, validationObject: validatedData.validationObject}, 422);
        }
        const updatedLocation = await locationModel.updateLocationLogic(location);
        return response.success(req, res, updatedLocation, 200);
    } catch (error) {
        return response.error(req,res,{message:`updateLocation: ${error.message}`},422);
    }
}
const deleteLocation = async (req,res) => {
    try {
        const location_id = req.params.location_id;
        let errorMessage='';
        if(!location_id){
            errorMessage='El id de la localidad no puede ser nulo o vacio';
            return response.error(req,res,{message:errorMessage}, 422);
        }
        await locationModel.deleteLocation(location_id);
        return response.success(req, res, {}, 200);
    } catch (error) {
        return response.error(req,res,{message:`deleteLocation: ${error.message}`},422);
    }
}
module.exports = {
    createLocation,
    getLocations,
    updateLocation,
    deleteLocation
}
