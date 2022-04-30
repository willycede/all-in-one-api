//Import necessary libraries
const knex = require('../db/knex')

//get all roles with status 1 
const getStatesByCountryId = async({country_id})=>{
    return await knex.select()
    .from('state')
    .where({country_id})
    .orderBy('name','asc')
}
module.exports = {
    getStatesByCountryId,
}