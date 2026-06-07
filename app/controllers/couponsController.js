const couponsModel = require('../models/coupons');
const response = require('../config/response');

const validateCoupon = async (req, res) => {
	try {
		const code = req.body.code || req.query.code;
		const idShoppingCar = parseInt(req.body.id_shopping_car || req.query.id_shopping_car, 10);

		if (!code) {
			return response.error(req, res, { message: 'El código del cupón es requerido' }, 422);
		}

		let subtotal = parseFloat(req.body.subtotal, 10);
		if (!Number.isFinite(subtotal) && idShoppingCar) {
			subtotal = await couponsModel.getCartSubtotal(idShoppingCar);
		}

		const result = await couponsModel.validateCouponForCart(code, subtotal || 0);
		if (!result.valid) {
			return response.error(req, res, { message: result.message }, 422);
		}

		return response.success(req, res, {
			code: result.coupon.code,
			description: result.coupon.description,
			discount_type: result.coupon.discount_type,
			discount_value: result.coupon.discount_value,
			discount_amount: result.discountAmount,
		}, 200);
	} catch (error) {
		return response.error(req, res, { message: `validateCoupon: ${error.message}` }, 422);
	}
};

const applyCoupon = async (req, res) => {
	try {
		const code = req.body.code;
		const idShoppingCar = parseInt(req.body.id_shopping_car, 10);
		const idUser = parseInt(req.userInfo && req.userInfo.id_users, 10);

		if (!code) {
			return response.error(req, res, { message: 'El código del cupón es requerido' }, 422);
		}
		if (!idShoppingCar) {
			return response.error(req, res, { message: 'id_shopping_car es requerido' }, 422);
		}
		if (!idUser) {
			return response.error(req, res, { message: 'No autorizado' }, 403);
		}

		const result = await couponsModel.applyCouponToCart({
			id_shopping_car: idShoppingCar,
			id_user: idUser,
			code,
		});

		if (!result.valid) {
			return response.error(req, res, { message: result.message }, 422);
		}

		return response.success(req, res, result, 200);
	} catch (error) {
		return response.error(req, res, { message: `applyCoupon: ${error.message}` }, 422);
	}
};

const removeCoupon = async (req, res) => {
	try {
		const idShoppingCar = parseInt(req.params.id_shopping_car, 10);
		const idUser = parseInt(req.userInfo && req.userInfo.id_users, 10);

		if (!idShoppingCar) {
			return response.error(req, res, { message: 'id_shopping_car es requerido' }, 422);
		}
		if (!idUser) {
			return response.error(req, res, { message: 'No autorizado' }, 403);
		}

		await couponsModel.removeCouponFromCart({
			id_shopping_car: idShoppingCar,
			id_user: idUser,
		});

		return response.success(req, res, { removed: true }, 200);
	} catch (error) {
		return response.error(req, res, { message: `removeCoupon: ${error.message}` }, 422);
	}
};

const adminListCoupons = async (req, res) => {
	try {
		const items = await couponsModel.listCoupons();
		return response.success(req, res, { items }, 200);
	} catch (error) {
		return response.error(req, res, { message: `adminListCoupons: ${error.message}` }, 422);
	}
};

const adminCreateCoupon = async (req, res) => {
	try {
		const created = await couponsModel.createCoupon(req.body);
		return response.success(req, res, created, 201);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

const adminUpdateCoupon = async (req, res) => {
	try {
		const id = parseInt(req.params.id, 10);
		if (!id) {
			return response.error(req, res, { message: 'ID de cupón requerido' }, 422);
		}
		const updated = await couponsModel.updateCoupon(id, req.body);
		return response.success(req, res, updated, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

module.exports = {
	validateCoupon,
	applyCoupon,
	removeCoupon,
	adminListCoupons,
	adminCreateCoupon,
	adminUpdateCoupon,
};
