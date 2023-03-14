const express = require('express')
const router = express.Router()
const orderHistoryController = require('../../controllers/orderHistoryController')

router.get("/get_order_history/:id_user", orderHistoryController.getOrdersHistory);


module.exports = router;