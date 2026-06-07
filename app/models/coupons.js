const knex = require('../db/knex');
const generalConstants = require('../constants/constants');
const shoppingModel = require('./shopping');

const normalizeCode = (code) => String(code || '').trim().toUpperCase();

const calculateDiscountAmount = (coupon, subtotal) => {
	const safeSubtotal = Math.max(0, parseFloat(subtotal) || 0);
	const value = parseFloat(coupon.discount_value) || 0;

	if (coupon.discount_type === 'percent') {
		const amount = safeSubtotal * (value / 100);
		return Math.min(amount, safeSubtotal);
	}

	return Math.min(value, safeSubtotal);
};

const findActiveCouponByCode = async (code) => {
	const normalized = normalizeCode(code);
	if (!normalized) {
		return null;
	}

	return knex('coupons')
		.where({ code: normalized, status: generalConstants.STATUS_ACTIVE })
		.first();
};

const validateCouponForCart = async (code, subtotal) => {
	const coupon = await findActiveCouponByCode(code);
	if (!coupon) {
		return { valid: false, message: 'El código de cupón no es válido' };
	}

	const now = new Date();
	if (coupon.valid_from && new Date(coupon.valid_from) > now) {
		return { valid: false, message: 'Este cupón aún no está activo' };
	}
	if (coupon.valid_until && new Date(coupon.valid_until) < now) {
		return { valid: false, message: 'Este cupón ha expirado' };
	}
	if (coupon.max_uses !== null && coupon.max_uses !== undefined) {
		const maxUses = parseInt(coupon.max_uses, 10);
		const usedCount = parseInt(coupon.used_count, 10) || 0;
		if (usedCount >= maxUses) {
			return { valid: false, message: 'Este cupón ya alcanzó el límite de usos' };
		}
	}

	const minPurchase = parseFloat(coupon.min_purchase) || 0;
	const safeSubtotal = parseFloat(subtotal) || 0;
	if (safeSubtotal < minPurchase) {
		return {
			valid: false,
			message: `Compra mínima de $${minPurchase.toFixed(2)} para usar este cupón`,
		};
	}

	const discountAmount = calculateDiscountAmount(coupon, safeSubtotal);
	if (discountAmount <= 0) {
		return { valid: false, message: 'El cupón no aplica a este carrito' };
	}

	return {
		valid: true,
		coupon,
		discountAmount: parseFloat(discountAmount.toFixed(2)),
		message: 'Cupón válido',
	};
};

const getCartSubtotal = async (idShoppingCar) => {
	const details = await shoppingModel.getShopDetailsCarByIdShop(idShoppingCar);
	let subtotal = 0;
	for (let i = 0; i < details.length; i += 1) {
		const detail = details[i];
		subtotal += parseFloat(detail.details_subtotal)
			|| (parseFloat(detail.details_price) * parseFloat(detail.details_quantity))
			|| 0;
	}
	return subtotal;
};

const assertCartOwnership = async (idShoppingCar, idUser) => {
	const cart = await knex('shopping_car')
		.where({ id_shopping_car: idShoppingCar })
		.first();

	if (!cart) {
		throw new Error('Carrito no encontrado');
	}
	if (parseInt(cart.id_user, 10) !== parseInt(idUser, 10)) {
		throw new Error('No tienes permiso para modificar este carrito');
	}
	return cart;
};

const applyCouponToCart = async ({ id_shopping_car, id_user, code }) => {
	const cart = await assertCartOwnership(id_shopping_car, id_user);
	const subtotal = await getCartSubtotal(id_shopping_car);
	const validation = await validateCouponForCart(code, subtotal);

	if (!validation.valid) {
		return validation;
	}

	await knex('shopping_car')
		.where({ id_shopping_car })
		.update({
			coupon_code: validation.coupon.code,
			coupon_discount: validation.discountAmount,
			updated_at: knex.fn.now(),
		});

	return {
		valid: true,
		message: 'Cupón aplicado correctamente',
		coupon_code: validation.coupon.code,
		coupon_description: validation.coupon.description,
		discount_type: validation.coupon.discount_type,
		discount_value: validation.coupon.discount_value,
		discount_amount: validation.discountAmount,
		subtotal,
	};
};

const incrementCouponUsage = async (idShoppingCar) => {
	const cart = await knex('shopping_car')
		.where({ id_shopping_car: idShoppingCar })
		.first();

	if (!cart || !cart.coupon_code) {
		return null;
	}

	const code = normalizeCode(cart.coupon_code);
	await knex('coupons')
		.where({ code })
		.increment('used_count', 1);

	return code;
};

const removeCouponFromCart = async ({ id_shopping_car, id_user }) => {
	await assertCartOwnership(id_shopping_car, id_user);

	await knex('shopping_car')
		.where({ id_shopping_car })
		.update({
			coupon_code: null,
			coupon_discount: 0,
			updated_at: knex.fn.now(),
		});

	return { removed: true };
};

const listCoupons = async () => {
	return knex('coupons')
		.select('*')
		.orderBy('created_at', 'desc');
};

const createCoupon = async (payload) => {
	const code = normalizeCode(payload.code);
	if (!code) {
		throw new Error('El código es requerido');
	}

	const existing = await knex('coupons').where({ code }).first();
	if (existing) {
		throw new Error('Ya existe un cupón con ese código');
	}

	const discountType = payload.discount_type === 'fixed' ? 'fixed' : 'percent';
	const discountValue = parseFloat(payload.discount_value);
	if (!Number.isFinite(discountValue) || discountValue <= 0) {
		throw new Error('El valor del descuento debe ser mayor a 0');
	}
	if (discountType === 'percent' && discountValue > 100) {
		throw new Error('El porcentaje no puede ser mayor a 100');
	}

	const result = await knex('coupons').insert({
		code,
		description: payload.description || null,
		discount_type: discountType,
		discount_value: discountValue,
		min_purchase: parseFloat(payload.min_purchase) || 0,
		max_uses: payload.max_uses ? parseInt(payload.max_uses, 10) : null,
		valid_from: payload.valid_from || null,
		valid_until: payload.valid_until || null,
		status: generalConstants.STATUS_ACTIVE,
		used_count: 0,
	});

	return knex('coupons').where({ id_coupon: result[0] }).first();
};

const updateCoupon = async (idCoupon, payload) => {
	const id = parseInt(idCoupon, 10);
	const coupon = await knex('coupons').where({ id_coupon: id }).first();
	if (!coupon) {
		throw new Error('Cupón no encontrado');
	}

	const updates = { updated_at: knex.fn.now() };

	if (payload.description !== undefined) {
		updates.description = payload.description;
	}
	if (payload.discount_type !== undefined) {
		updates.discount_type = payload.discount_type === 'fixed' ? 'fixed' : 'percent';
	}
	if (payload.discount_value !== undefined) {
		const discountValue = parseFloat(payload.discount_value);
		if (!Number.isFinite(discountValue) || discountValue <= 0) {
			throw new Error('El valor del descuento debe ser mayor a 0');
		}
		const type = updates.discount_type || coupon.discount_type;
		if (type === 'percent' && discountValue > 100) {
			throw new Error('El porcentaje no puede ser mayor a 100');
		}
		updates.discount_value = discountValue;
	}
	if (payload.min_purchase !== undefined) {
		updates.min_purchase = parseFloat(payload.min_purchase) || 0;
	}
	if (payload.max_uses !== undefined) {
		updates.max_uses = payload.max_uses ? parseInt(payload.max_uses, 10) : null;
	}
	if (payload.valid_from !== undefined) {
		updates.valid_from = payload.valid_from || null;
	}
	if (payload.valid_until !== undefined) {
		updates.valid_until = payload.valid_until || null;
	}
	if (payload.status !== undefined) {
		updates.status = parseInt(payload.status, 10) === generalConstants.STATUS_INACTIVE
			? generalConstants.STATUS_INACTIVE
			: generalConstants.STATUS_ACTIVE;
	}

	await knex('coupons').where({ id_coupon: id }).update(updates);
	return knex('coupons').where({ id_coupon: id }).first();
};

const seedDefaultCoupons = async () => {
	const defaults = [
		{
			code: 'ALLINONE10',
			description: '10% de descuento en tu compra',
			discount_type: 'percent',
			discount_value: 10,
			min_purchase: 0,
			max_uses: null,
		},
		{
			code: 'BIENVENIDO25',
			description: '$25 de descuento en compras mayores a $100',
			discount_type: 'fixed',
			discount_value: 25,
			min_purchase: 100,
			max_uses: null,
		},
	];

	for (let i = 0; i < defaults.length; i += 1) {
		const item = defaults[i];
		const exists = await knex('coupons').where({ code: item.code }).first();
		if (!exists) {
			await knex('coupons').insert({
				...item,
				status: generalConstants.STATUS_ACTIVE,
				used_count: 0,
			});
		}
	}
};

module.exports = {
	normalizeCode,
	calculateDiscountAmount,
	validateCouponForCart,
	applyCouponToCart,
	incrementCouponUsage,
	removeCouponFromCart,
	getCartSubtotal,
	seedDefaultCoupons,
	listCoupons,
	createCoupon,
	updateCoupon,
};
