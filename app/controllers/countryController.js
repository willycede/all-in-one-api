const countryModel = require('../models/country')
const response = require('../config/response');

const getCountries = async(req,res)=>{
    try {
        const countries = await countryModel.getCountries({}) 
        return response.success(req,res,countries,200)
    } catch (error) {
        return response.error(req,res,{message:`getCountries: ${error.message}`},422)
    }
}
module.exports = {
    getCountries,
}