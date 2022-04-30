const stateModel = require('../models/state')
const response = require('../config/response');

const getStatesByCountryId = async(req,res)=>{
    try {
        const country_id = req.params.country_id
        let errorMessage=''
        if(country_id == null || country_id==undefined || country_id ==''){
            errorMessage='El id del país no puede ser nulo o vacio'
            return response.error(req,res,{message:errorMessage, validationObject}, 422)
        }
        const states = await stateModel.getStatesByCountryId({country_id})
        return response.success(req,res,states,200)
    } catch (error) {
        return response.error(req,res,{message:`getStatesByCountryId: ${error.message}`},422)
    }
}
module.exports = {
    getStatesByCountryId,
}