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


module.exports = {
    getOrdersHistory
}