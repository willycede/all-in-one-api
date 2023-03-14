const constants = require("../constants/constants");

const generalConstants = require('../constants/constants')
const utils = require('../utils/globalFunctions')
const knex = require('../db/knex')



const getOrderHistory = async (id_user) => {

    const query = {
        id_user:id_user
    }

    return await knex.select()
        .from('shopping_car')
        .where(query)
        .orderBy('id_shopping_car','desc');

};


module.exports = {
    getOrderHistory
}