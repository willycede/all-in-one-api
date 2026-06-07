const axios = require('axios');
const cartValidation = require('./cartValidation');
const couponsModel = require('../models/coupons');
const shoppingModel = require('../models/shopping');

const ORDER_STATUS_PENDING_PAYMENT = 2;
const ORDER_STATUS_ACTIVE_CART = 1;

const buildClientTransactionId = (orderId) => `${orderId}@${Date.now()}`;

const buildPayphoneAmountsFromCart = (cart) => {
	const subtotal = Math.round(parseFloat(cart.shopping_car_subtotal || 0) * 100);
	const couponDiscount = Math.round(parseFloat(cart.coupon_discount || 0) * 100);
	const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);
	const tax = Math.round(parseFloat(cart.shopping_car_iva || 0) * 100);
	const total = Math.round(parseFloat(cart.shopping_car_total || 0) * 100);

	return {
		amount: total,
		tax,
		amountWithTax: subtotalAfterCoupon,
		amountWithoutTax: 0,
		service: 0,
		tip: 0,
	};
};

const isDuplicateClientTransactionError = (error) => {
	const message = [
		error.message,
		error.response && error.response.data && error.response.data.message,
		JSON.stringify(error.response && error.response.data),
	].filter(Boolean).join(' ').toLowerCase();

	return message.includes('clienttransactionid')
		|| message.includes('clienttxid')
		|| message.includes('transaccion')
		|| message.includes('transaction')
		|| message.includes('ya existe')
		|| message.includes('already exists')
		|| message.includes('duplicad');
};

const getOrderForPayment = async (orderId, userId) => {
	const cartRows = await shoppingModel.getShoppingCar(orderId);
	const cart = cartRows && cartRows[0];

	if (!cart) {
		const err = new Error('Orden no encontrada');
		err.statusCode = 404;
		throw err;
	}

	if (userId && parseInt(cart.id_user, 10) !== parseInt(userId, 10)) {
		const err = new Error('No tienes permiso para acceder a esta orden');
		err.statusCode = 403;
		throw err;
	}

	return cart;
};

const validateOrderForPayment = async (orderId, { sentSubtotalCents } = {}) => {
	const docValidation = await cartValidation.validateShoppingCartDocuments(orderId);
	if (!docValidation.valid) {
		const missingItems = docValidation.items
			.filter((item) => item.requires_documents && !item.valid)
			.map((item) => `${item.product_name}: ${item.missing_documents.join(', ')}`)
			.join('; ');

		const err = new Error(`Faltan documentos obligatorios antes de pagar. ${missingItems}`);
		err.statusCode = 422;
		err.validation = docValidation;
		throw err;
	}

	const cartRows = await shoppingModel.getShoppingCar(orderId);
	const cart = cartRows && cartRows[0];

	if (cart && cart.coupon_code) {
		const subtotal = await couponsModel.getCartSubtotal(orderId);
		const couponValidation = await couponsModel.validateCouponForCart(cart.coupon_code, subtotal);
		if (!couponValidation.valid) {
			const err = new Error(couponValidation.message || 'El cupón aplicado ya no es válido');
			err.statusCode = 422;
			throw err;
		}

		const storedDiscount = parseFloat(cart.coupon_discount) || 0;
		const expectedDiscount = couponValidation.discountAmount;
		if (Math.abs(storedDiscount - expectedDiscount) > 0.02) {
			const err = new Error('El descuento del cupón no coincide con el carrito. Vuelve a aplicar el cupón.');
			err.statusCode = 422;
			throw err;
		}

		if (sentSubtotalCents != null && !Number.isNaN(sentSubtotalCents)) {
			const expectedSubtotalCents = Math.round(Math.max(0, subtotal - expectedDiscount) * 100);
			if (Math.abs(expectedSubtotalCents - sentSubtotalCents) > 1) {
				const err = new Error('El monto enviado a Payphone no coincide con el descuento del cupón');
				err.statusCode = 422;
				throw err;
			}
		}
	}

	return cart;
};

const assertPayableOrderStatus = (cart, { allowActiveCart = true } = {}) => {
	const status = parseInt(cart.status, 10);
	const allowed = allowActiveCart
		? [ORDER_STATUS_ACTIVE_CART, ORDER_STATUS_PENDING_PAYMENT]
		: [ORDER_STATUS_PENDING_PAYMENT];

	if (!allowed.includes(status)) {
		const err = new Error('Esta orden no está pendiente de pago');
		err.statusCode = 422;
		throw err;
	}
};

const buildPreparePayload = ({
	orderId,
	clientTransactionId,
	amounts,
	reference,
}) => {
	const responseUrl = process.env.PAYPHONE_RESPONSE_URL
		|| `${process.env.FRONTEND_URL || 'http://localhost:8082'}/payment/ValidatePayment`;

	const storeId = process.env.PAYPHONE_STORE_ID || process.env.PAYSTOREID || null;

	const payload = {
		responseUrl,
		amount: amounts.amount,
		tax: amounts.tax,
		amountWithTax: amounts.amountWithTax,
		amountWithoutTax: amounts.amountWithoutTax != null ? amounts.amountWithoutTax : 0,
		service: amounts.service || 0,
		tip: amounts.tip || 0,
		currency: 'USD',
		reference: reference || `PAGO ORDEN DE PAGO #${orderId}`,
		clientTransactionId,
		oneTime: false,
		expireIn: 0,
	};

	if (storeId) {
		payload.storeId = storeId;
	}

	return payload;
};

const callPayphonePrepare = async (payload, orderId, { retryOnDuplicate = true } = {}) => {
	let clientTransactionId = payload.clientTransactionId;
	const maxAttempts = retryOnDuplicate ? 2 : 1;

	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		const currentPayload = { ...payload, clientTransactionId };

		try {
			const config = {
				method: 'post',
				url: process.env.PAYURLBTN,
				headers: {
					Authorization: `Bearer ${process.env.PAYTOKENBTN}`,
					'Content-Type': 'application/json',
				},
				data: JSON.stringify(currentPayload),
			};

			const respuesta = await axios(config);

			return {
				url: respuesta.data.payWithPayPhone,
				clientTransactionId,
				raw: respuesta.data,
			};
		} catch (error) {
			if (attempt < maxAttempts - 1 && isDuplicateClientTransactionError(error)) {
				clientTransactionId = buildClientTransactionId(orderId);
				continue;
			}
			throw error;
		}
	}

	throw new Error('No se pudo generar el link de pago');
};

const preparePaymentLink = async ({
	orderId,
	userId,
	amounts,
	reference,
	clientTransactionId,
	allowActiveCart = true,
	sentSubtotalCents,
}) => {
	const cart = await getOrderForPayment(orderId, userId);
	assertPayableOrderStatus(cart, { allowActiveCart });
	await validateOrderForPayment(orderId, { sentSubtotalCents });

	const resolvedAmounts = amounts || buildPayphoneAmountsFromCart(cart);
	const resolvedClientTransactionId = clientTransactionId || buildClientTransactionId(orderId);
	const payload = buildPreparePayload({
		orderId,
		clientTransactionId: resolvedClientTransactionId,
		amounts: resolvedAmounts,
		reference,
	});

	const result = await callPayphonePrepare(payload, orderId);

	await shoppingModel.putShoppingUpdatePay(orderId, {
		body: {
			url_payphone: result.url,
			status: ORDER_STATUS_PENDING_PAYMENT,
		},
	});

	return {
		...result,
		orderId,
	};
};

module.exports = {
	ORDER_STATUS_PENDING_PAYMENT,
	ORDER_STATUS_ACTIVE_CART,
	buildClientTransactionId,
	buildPayphoneAmountsFromCart,
	isDuplicateClientTransactionError,
	getOrderForPayment,
	validateOrderForPayment,
	assertPayableOrderStatus,
	buildPreparePayload,
	callPayphonePrepare,
	preparePaymentLink,
};
