const cityModel = require('../models/city')
const response = require('../config/response');

const getCitiesByStateId = async(req,res)=>{
    try {
        const state_id = req.params.state_id
        let errorMessage=''
        if(state_id == null || state_id==undefined || state_id ==''){
            errorMessage='El id de la provincia no puede ser nulo o vacio'
            return response.error(req,res,{message:errorMessage, validationObject}, 422)
        }
        const cities = await cityModel.getCitiesByStateId({state_id}) 
        return response.success(req,res,cities,200)
    } catch (error) {
        return response.error(req,res,{message:`getCitiesByStateId: ${error.message}`},422)
    }
}
module.exports = {
    getCitiesByStateId,
}