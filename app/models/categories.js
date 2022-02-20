//Import necessary libraries
const generalConstants = require('../constants/constants')
const knex = require('../db/knex')

const getCategoriesByCompanyId = async({company_id})=>{
    return await knex.select()
    .from('categories')
    .where({company_id, status: generalConstants.STATUS_ACTIVE})
    .orderBy('name','asc')
}
module.exports = {
    getCategoriesByCompanyId,
}