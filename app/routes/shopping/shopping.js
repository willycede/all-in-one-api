const express = require('express');
const router = express.Router();
const shopController = require('../../controllers/shoppingController');
const { verifyToken, assertSelfUser } = require('../../middleware/auth');
const { rateLimit } = require('../../middleware/rateLimit');

const payphoneRateLimit = rateLimit({ windowMs: 5 * 60 * 1000, max: 10, keyPrefix: 'payphone' });

router.post('/create_shopp', verifyToken, assertSelfUser, shopController.createShoppingCarCtr);
router.post('/create_shoppDetails', verifyToken, assertSelfUser, shopController.createShoppingCarDetailsCtr);
router.post('/create_invoice_data', verifyToken, assertSelfUser, shopController.createInvoiceDataCtr);
router.get('/get_shop/:id_user', verifyToken, assertSelfUser, shopController.getShoppCar);
router.get('/get_shop_by_id/:id_orden', verifyToken, shopController.getShoppCarById);
router.get('/get_shopDetails/:id_shopping_car', verifyToken, shopController.getShoppCarDetails);
router.get('/get_invoice_data/:id_user', verifyToken, assertSelfUser, shopController.getInvoiceData);
router.post('/pay_shop', verifyToken, shopController.putUpdateShoppingPay);
router.post('/payphone', verifyToken, payphoneRateLimit, shopController.ShppoingCarUrlPay);
router.post('/payphone/regenerate', verifyToken, payphoneRateLimit, shopController.regeneratePayphoneLink);
router.get('/payphone/resolve_link', payphoneRateLimit, shopController.resolvePaymentLink);
router.post('/payphone/confirm', shopController.ShppoingCarUrlPayConfirm);
router.post('/payphone/invoice/state', verifyToken, shopController.putUpdateInoviceState);
router.post('/sendmail', verifyToken, shopController.sendMailShoppingCar);
router.post('/sendmail_factura', verifyToken, shopController.sendMailShoppFactura);
router.post('/delete_shoppDetails', verifyToken, assertSelfUser, shopController.deleteShoppingCarDetailCtr);
router.get('/get_comprobante_electronico/:id_orden', verifyToken, shopController.getInoviceE);

module.exports = router;
