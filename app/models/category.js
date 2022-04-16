//Import necessary libraries
const generalConstants = require('../constants/constants')
const knex = require('../db/knex')

const getCategoriesByCompanyId = async({id_company})=>{
    return await knex.select()
    .from('category')
    .where({id_company, status: generalConstants.STATUS_ACTIVE})
    .orderBy('name','asc')
}
module.exports = {
    getCategoriesByCompanyId,
}