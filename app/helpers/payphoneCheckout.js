const axios = require('axios');
const knex = require('../db/knex');
const cartValidation = require('./cartValidation');
const couponsModel = require('../models/coupons');
const shoppingModel = require('../models/shopping');
const ORDER_STATUS = require('../constants/orderStatus');
const {
	normalizePayphoneAmounts,
	buildPayphoneAmountsFromParts,
	toCents,
} = require('./payphoneAmounts');

const ORDER_STATUS_PENDING_PAYMENT = ORDER_STATUS.PENDING_PAYMENT;
const ORDER_STATUS_ACTIVE_CART = ORDER_STATUS.ACTIVE_CART;
const ORDER_STATUS_PAID = ORDER_STATUS.PAID;
const ORDER_STATUS_CANCELLED = ORDER_STATUS.CANCELLED;

const buildClientTransactionId = (orderId) => `${orderId}@${Date.now()}`;

const extractPayphoneErrorMessage = (error) => {
	const data = error.response && error.response.data;

	if (typeof data === 'string' && data.trim()) {
		return data.trim();
	}

	if (data && typeof data === 'object') {
		if (data.message) return String(data.message);
		if (data.Message) return String(data.Message);
		if (data.error) return String(data.error);
		if (data.title) return String(data.title);
		if (Array.isArray(data.errors) && data.errors.length) {
			return data.errors.map((item) => {
				if (Array.isArray(item.errorDescriptions) && item.errorDescriptions.length) {
					return item.errorDescriptions.join('; ');
				}
				return item.message || JSON.stringify(item);
			}).join('; ');
		}
		try {
			return JSON.stringify(data);
		} catch (jsonError) {
			return error.message;
		}
	}

	return error.message || 'Error desconocido de Payphone';
};

const createPayphoneError = (message, { step, statusCode = 422, details, validation } = {}) => {
	const err = new Error(message);
	err.step = step;
	err.statusCode = statusCode;
	if (details) err.details = details;
	if (validation) err.validation = validation;
	return err;
};

const logPayphoneFailure = (step, context) => {
	console.error(`[payphone:${step}] ${JSON.stringify({
		ts: new Date().toISOString(),
		...context,
	}, null, 2)}`);
};

const toPayphoneHttpPayload = (error, fallbackMessage) => ({
	message: error.message || fallbackMessage,
	step: error.step || 'unknown',
	details: error.details || error.payphoneResponse || null,
	validation: error.validation || null,
});

const buildPayphoneAmountsFromCart = (cart) => (
	buildPayphoneAmountsFromParts({
		subtotal: cart.shopping_car_subtotal,
		couponDiscount: cart.coupon_discount,
		tax: cart.shopping_car_iva,
	})
);

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
		logPayphoneFailure('order_not_found', { orderId, userId });
		throw createPayphoneError('Orden no encontrada', { step: 'order_not_found', statusCode: 404 });
	}

	if (userId && parseInt(cart.id_user, 10) !== parseInt(userId, 10)) {
		logPayphoneFailure('forbidden', { orderId, userId, cartUserId: cart.id_user });
		throw createPayphoneError('No tienes permiso para acceder a esta orden', { step: 'forbidden', statusCode: 403 });
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

		const err = createPayphoneError(
			`Faltan documentos obligatorios antes de pagar. ${missingItems}`,
			{ step: 'documents', statusCode: 422, validation: docValidation }
		);
		logPayphoneFailure('documents', { orderId, validation: docValidation });
		throw err;
	}

	const cartRows = await shoppingModel.getShoppingCar(orderId);
	const cart = cartRows && cartRows[0];

	if (cart && cart.coupon_code) {
		const subtotal = await couponsModel.getCartSubtotal(orderId);
		const couponValidation = await couponsModel.validateCouponForCart(cart.coupon_code, subtotal);
		if (!couponValidation.valid) {
			logPayphoneFailure('coupon_invalid', { orderId, coupon: cart.coupon_code, message: couponValidation.message });
			throw createPayphoneError(
				couponValidation.message || 'El cupón aplicado ya no es válido',
				{ step: 'coupon', statusCode: 422 }
			);
		}

		const storedDiscount = parseFloat(cart.coupon_discount) || 0;
		const expectedDiscount = couponValidation.discountAmount;
		if (Math.abs(storedDiscount - expectedDiscount) > 0.02) {
			logPayphoneFailure('coupon_discount_mismatch', {
				orderId,
				storedDiscount,
				expectedDiscount,
			});
			throw createPayphoneError(
				'El descuento del cupón no coincide con el carrito. Vuelve a aplicar el cupón.',
				{ step: 'coupon', statusCode: 422, details: { storedDiscount, expectedDiscount } }
			);
		}

		if (sentSubtotalCents != null && !Number.isNaN(sentSubtotalCents)) {
			const expectedSubtotalCents = Math.round(Math.max(0, subtotal - expectedDiscount) * 100);
			if (Math.abs(expectedSubtotalCents - sentSubtotalCents) > 1) {
				logPayphoneFailure('amount_mismatch', {
					orderId,
					sentSubtotalCents,
					expectedSubtotalCents,
				});
				throw createPayphoneError(
					`El monto enviado a Payphone no coincide con el carrito (enviado: ${sentSubtotalCents}, esperado: ${expectedSubtotalCents})`,
					{
						step: 'amount',
						statusCode: 422,
						details: { sentSubtotalCents, expectedSubtotalCents },
					}
				);
			}
		}
	}

	return cart;
};

const assertPayableOrderStatus = (cart, { allowActiveCart = true } = {}) => {
	const status = parseInt(cart.status, 10);

	if (status === ORDER_STATUS_CANCELLED) {
		logPayphoneFailure('order_cancelled', { orderId: cart.id_shopping_car, status });
		throw createPayphoneError(
			'Esta orden fue cancelada. El enlace de pago ya no está disponible.',
			{ step: 'order_cancelled', statusCode: 410, details: { status } }
		);
	}

	if (status === ORDER_STATUS_PAID) {
		logPayphoneFailure('order_paid', { orderId: cart.id_shopping_car, status });
		throw createPayphoneError(
			'Esta orden ya fue pagada.',
			{ step: 'order_paid', statusCode: 410, details: { status } }
		);
	}

	const allowed = allowActiveCart
		? [ORDER_STATUS_ACTIVE_CART, ORDER_STATUS_PENDING_PAYMENT]
		: [ORDER_STATUS_PENDING_PAYMENT];

	if (!allowed.includes(status)) {
		logPayphoneFailure('order_status', { orderId: cart.id_shopping_car, status, allowed });
		throw createPayphoneError(
			`Esta orden no está pendiente de pago (estado actual: ${status})`,
			{ step: 'order_status', statusCode: 422, details: { status, allowed } }
		);
	}
};

const resolvePaymentLink = async ({ orderId, payphoneUrl }) => {
	let cart;

	if (orderId) {
		cart = await getOrderForPayment(orderId, null);
	} else if (payphoneUrl) {
		cart = await knex('shopping_car')
			.where({ url_payphone: payphoneUrl })
			.first();

		if (!cart) {
			logPayphoneFailure('payment_link_not_found', { payphoneUrl: payphoneUrl.slice(0, 80) });
			throw createPayphoneError(
				'Enlace de pago no encontrado o expirado',
				{ step: 'payment_link_not_found', statusCode: 404 }
			);
		}
	} else {
		throw createPayphoneError(
			'Parámetros de enlace inválidos',
			{ step: 'validation', statusCode: 422 }
		);
	}

	assertPayableOrderStatus(cart, { allowActiveCart: false });

	const url = cart.url_payphone || payphoneUrl;
	if (!url || !String(url).startsWith('http')) {
		logPayphoneFailure('no_payment_url', { orderId: cart.id_shopping_car });
		throw createPayphoneError(
			'No hay un enlace de pago activo. Genera uno nuevo desde Mis pedidos.',
			{ step: 'no_payment_url', statusCode: 422 }
		);
	}

	return {
		url,
		orderId: cart.id_shopping_car,
	};
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
	const normalizedAmounts = normalizePayphoneAmounts(amounts);

	if (amounts.amount != null && Math.round(Number(amounts.amount)) !== normalizedAmounts.amount) {
		logPayphoneFailure('amount_normalized', {
			orderId,
			receivedAmount: amounts.amount,
			normalizedAmount: normalizedAmounts.amount,
			components: normalizedAmounts,
		});
	}

	const payload = {
		responseUrl,
		amount: normalizedAmounts.amount,
		tax: normalizedAmounts.tax,
		amountWithTax: normalizedAmounts.amountWithTax,
		amountWithoutTax: normalizedAmounts.amountWithoutTax,
		service: normalizedAmounts.service,
		tip: normalizedAmounts.tip,
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

			if (!respuesta.data || !respuesta.data.payWithPayPhone) {
				logPayphoneFailure('prepare_empty_url', {
					orderId,
					clientTransactionId,
					payphoneResponse: respuesta.data,
				});
				throw createPayphoneError(
					'Payphone respondió sin URL de pago',
					{ step: 'payphone_api', details: respuesta.data }
				);
			}

			return {
				url: respuesta.data.payWithPayPhone,
				clientTransactionId,
				raw: respuesta.data,
			};
		} catch (error) {
			if (error.step) {
				throw error;
			}

			if (attempt < maxAttempts - 1 && isDuplicateClientTransactionError(error)) {
				clientTransactionId = buildClientTransactionId(orderId);
				logPayphoneFailure('duplicate_retry', { orderId, clientTransactionId });
				continue;
			}

			const message = extractPayphoneErrorMessage(error);
			logPayphoneFailure('prepare_error', {
				orderId,
				clientTransactionId,
				httpStatus: error.response && error.response.status,
				message,
				payphoneResponse: error.response && error.response.data,
				payload: currentPayload,
			});

			const err = createPayphoneError(message, {
				step: 'payphone_api',
				statusCode: (error.response && error.response.status) || 422,
				details: error.response && error.response.data,
			});
			err.payphoneResponse = error.response && error.response.data;
			throw err;
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

	const resolvedAmounts = normalizePayphoneAmounts(amounts || buildPayphoneAmountsFromCart(cart));
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
	ORDER_STATUS_PAID,
	ORDER_STATUS_CANCELLED,
	buildClientTransactionId,
	buildPayphoneAmountsFromCart,
	isDuplicateClientTransactionError,
	extractPayphoneErrorMessage,
	logPayphoneFailure,
	toPayphoneHttpPayload,
	getOrderForPayment,
	validateOrderForPayment,
	assertPayableOrderStatus,
	resolvePaymentLink,
	buildPreparePayload,
	callPayphonePrepare,
	preparePaymentLink,
};
