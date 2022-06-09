//Import necessary libraries
const generalConstants = require('../constants/constants')
const knex = require('../db/knex')

const getGeneralCategories = async() => {
    return await knex.select()
    .from('general_categories')
    .where({status: generalConstants.STATUS_ACTIVE})
    .orderBy('name','asc')
}

module.exports = {
    getGeneralCategories
};