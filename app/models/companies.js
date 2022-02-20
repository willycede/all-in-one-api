//Import necessary libraries
const generalConstants = require('../constants/constants')
const knex = require('../db/knex')

//get all roles with status 1 
const getCompanies = async()=>{
    return await knex.select()
    .from('companies')
    .where({status: generalConstants.STATUS_ACTIVE})
    .orderBy('name','asc')
}
module.exports = {
    getCompanies,
}