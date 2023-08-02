const express = require('express')
const router = express.Router()
const orderHistoryController = require('../../controllers/orderHistoryController')

router.get("/get_order_history/:id_user", orderHistoryController.getOrdersHistory);
router.get("/delete_order_history/:id_shopping_car/:id_user", orderHistoryController.deleteHistory);


module.exports = router;