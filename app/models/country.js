//Import necessary libraries
const knex = require('../db/knex')

//get all roles with status 1 
const getCountries = async()=>{
    return await knex.select()
    .from('country')
    .orderBy('name','asc')
}
module.exports = {
    getCountries,
}