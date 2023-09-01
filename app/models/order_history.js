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


const deleteOrderHistoryModel = async (id_shopping_car, id_user, trx) => {

    //console.log(id_shopping_car);

    await (trx || knex)('shopping_car')
    .where('id_shopping_car', '=', id_shopping_car)
    .update(
    {
        status:3
    });

    return await getOrderHistory(id_user);


};


module.exports = {
    getOrderHistory,
    deleteOrderHistoryModel
}