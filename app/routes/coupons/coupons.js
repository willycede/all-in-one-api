const express = require('express');
const router = express.Router();
const couponsController = require('../../controllers/couponsController');
const { verifyToken, assertAdmin } = require('../../middleware/auth');

router.get('/admin/list', verifyToken, assertAdmin, couponsController.adminListCoupons);
router.post('/admin', verifyToken, assertAdmin, couponsController.adminCreateCoupon);
router.put('/admin/:id', verifyToken, assertAdmin, couponsController.adminUpdateCoupon);

router.post('/validate', couponsController.validateCoupon);
router.post('/apply', verifyToken, couponsController.applyCoupon);
router.delete('/remove/:id_shopping_car', verifyToken, couponsController.removeCoupon);

module.exports = router;
