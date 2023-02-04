const express = require('express')
const router = express.Router()
const shopController = require('../../controllers/shoppingController')

router.post('/create_shopp', shopController.createShoppingCarCtr)
router.post('/create_shoppDetails', shopController.createShoppingCarDetailsCtr)
router.get("/get_shop/:id_user", shopController.getShoppCar);
router.get("/get_shopDetails/:id_shopping_car", shopController.getShoppCarDetails);
router.post("/pay_shop", shopController.putUpdateShoppingPay);
router.post("/payphone", shopController.ShppoingCarUrlPay);


module.exports = router;