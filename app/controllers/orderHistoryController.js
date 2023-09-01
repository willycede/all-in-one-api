const orderHistoriModel =  require("../models/order_history");
const response = require('../config/response');


const getOrdersHistory = async (req,res) => {
    try {

        const id_user = parseInt(req.params.id_user);
        const order = await orderHistoriModel.getOrderHistory(id_user);
        return response.success(req,res,order,200);
    } catch (error) {
        return response.error(req,res,{message:`getOrderHistory: ${error.message}`},422);
    }
}

const deleteHistory = async (req,res) => {
    try {

        
        const id_shopping_car = parseInt(req.params.id_shopping_car);
        const id_user = parseInt(req.params.id_user);

        const order = await orderHistoriModel.deleteOrderHistoryModel(id_shopping_car, id_user);
        //console.log(order);
        return response.success(req,res,order,200);
    } catch (error) {
        //console.log(error);
        return response.error(req,res,{message:`deleteOrderHistoryModel: ${error.message}`},422);
    }
}


module.exports = {
    getOrdersHistory,
    deleteHistory
}