const express = require('express')
const router = express.Router()
const shopController = require('../../controllers/shoppingController')

router.post('/create_shopp', shopController.createShoppingCarCtr)
router.post('/create_shoppDetails', shopController.createShoppingCarDetailsCtr)
router.post('/create_invoice_data', shopController.createInvoiceDataCtr)
router.get("/get_shop/:id_user", shopController.getShoppCar);
router.get("/get_shop_by_id/:id_orden", shopController.getShoppCarById);
router.get("/get_shopDetails/:id_shopping_car", shopController.getShoppCarDetails);
router.get("/get_invoice_data/:id_user", shopController.getInvoiceData);
router.post("/pay_shop", shopController.putUpdateShoppingPay);
router.post("/payphone", shopController.ShppoingCarUrlPay);
router.post("/payphone/confirm", shopController.ShppoingCarUrlPayConfirm);
router.post("/payphone/invoice/state", shopController.putUpdateInoviceState);
router.post("/sendmail", shopController.sendMailShoppingCar);
router.post("/sendmail_factura", shopController.sendMailShoppFactura);
router.get("/get_comprobante_electronico/:id_orden", shopController.getInoviceE);



module.exports = router;