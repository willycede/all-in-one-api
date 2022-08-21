const express = require('express')
const router = express.Router()
const shopController = require('../../controllers/shoppingController')


//router.get('/', shopController.get_Company)
router.post('/create_shopp', shopController.createShoppingCarCtr)
router.post('/create_shoppDetails', shopController.createShoppingCarDetailsCtr)
router.get("/get_shop/:id_user", shopController.getShoppCar);
router.get("/get_shopDetails/:id_shopping_car", shopController.getShoppCarDetails);
router.post("/payphone", shopController.registraConfirmaShop);
//router.put('/update_company', shopController.put_Company)
//router.delete('/delete_company', shopController.delete_Company)


module.exports = router;