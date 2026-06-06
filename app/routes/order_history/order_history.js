const express = require('express');
const router = express.Router();
const orderHistoryController = require('../../controllers/orderHistoryController');
const { verifyToken, assertSelfUser } = require('../../middleware/auth');

router.get(
	'/get_order_history/:id_user',
	verifyToken,
	assertSelfUser,
	orderHistoryController.getOrdersHistory
);
router.get(
	'/delete_order_history/:id_shopping_car/:id_user',
	verifyToken,
	assertSelfUser,
	orderHistoryController.deleteHistory
);
router.post(
	'/reprocess_invoice/:id_shopping_car/:id_user',
	verifyToken,
	assertSelfUser,
	orderHistoryController.reprocessInvoice
);

module.exports = router;
