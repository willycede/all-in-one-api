//Import necessary libraries
const generalConstants = require('../constants/constants')
const knex = require('../db/knex')

const getProductsByCategoryId = async({category_id})=>{
    return await knex.select()
    .from('products')
    .where({category_id, status: generalConstants.STATUS_ACTIVE})
    .orderBy('name','asc')
}
const getProductsByProductId = async({product_id})=>{
    return await knex.select()
    .from('products')
    .where({id:product_id, status: generalConstants.STATUS_ACTIVE})
    .orderBy('name','asc')
}
module.exports = {
    getProductsByCategoryId,
    getProductsByProductId
}