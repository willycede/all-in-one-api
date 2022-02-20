//Import necessary libraries
const knex = require('../db/knex')

//get all roles with status 1 
const getCitiesByStateId = async({state_id})=>{
    return await knex.select()
    .from('cities')
    .where({state_id})
    .orderBy('name','asc')
}
module.exports = {
    getCitiesByStateId,
}