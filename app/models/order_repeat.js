const knex = require('../db/knex');
const constants = require('../constants/constants');
const shoppingModel = require('./shopping');

const IVA_RATE = 0.15;
const ORDER_STATUS_PAID = 3;

const recalculateCartTotals = async (id_shopping_car, id_user) => {
	const shopCarDetails = await shoppingModel.getShopDetailsCarByIdShop(id_shopping_car);

	let subtotalshop = 0;
	let totalival = 0;
	let total = 0;
	let totaldiscount = 0;

	shopCarDetails.forEach((item) => {
		subtotalshop += parseFloat(item.details_subtotal) || 0;
		totalival += parseFloat(item.details_iva) || 0;
		total += parseFloat(item.details_total) || 0;
		totaldiscount += parseFloat(item.details_discount) || 0;
	});

	await shoppingModel.putShoppingUpdate(id_shopping_car, {
		body: {
			id_user,
			shopping_car_quantity: shopCarDetails.length,
			shopping_car_subtotal: parseFloat(subtotalshop).toFixed(6),
			shopping_car_total_discount: parseFloat(totaldiscount).toFixed(6),
			shopping_car_iva: parseFloat(totalival).toFixed(6),
			shopping_car_total: parseFloat(total).toFixed(6),
			status: constants.STATUS_ACTIVE,
		},
	});

	return shopCarDetails.length;
};

const repeatOrderForUser = async (id_shopping_car, id_user) => {
	const order = await knex('shopping_car')
		.where({ id_shopping_car, id_user })
		.first();

	if (!order) {
		throw new Error('Orden no encontrada');
	}

	if (parseInt(order.status, 10) !== ORDER_STATUS_PAID) {
		throw new Error('Solo puedes repetir pedidos que ya fueron pagados');
	}

	const sourceDetails = await shoppingModel.getShopDetailsCarByIdShop(id_shopping_car);
	if (!sourceDetails.length) {
		throw new Error('La orden no tiene productos para repetir');
	}

	let activeCarts = await shoppingModel.getShoppingCarActiveByUser(id_user);
	let targetCartId;

	if (activeCarts.length > 0) {
		targetCartId = activeCarts[0].id_shopping_car;
	} else {
		const created = await shoppingModel.createShoppingMetodo({
			body: {
				id_user,
				shopping_car_quantity: 0,
				shopping_car_subtotal: 0,
				shopping_car_total_discount: 0,
				shopping_car_iva: 0,
				shopping_car_total: 0,
				status: constants.STATUS_ACTIVE,
			},
		});
		targetCartId = created[0].id_shopping_car;
	}

	const added = [];
	const skipped = [];

	for (const line of sourceDetails) {
		const product = await knex('products')
			.where({ id_products: line.id_product, status: constants.STATUS_ACTIVE })
			.first();

		if (!product) {
			skipped.push({ name: line.name, reason: 'Producto no disponible' });
			continue;
		}

		const price = parseFloat(product.price) || 0;
		if (price <= 0) {
			skipped.push({ name: line.name, reason: 'Precio no válido' });
			continue;
		}

		const quantity = parseInt(line.details_quantity, 10) || 1;
		const subtotal = quantity * price;
		const iva = subtotal * IVA_RATE;
		const lineTotal = subtotal + iva;

		await shoppingModel.createShoppingDetailsMetodo({
			body: {
				id_user,
				id_details: 0,
				id_shopping_car: targetCartId,
				id_product: line.id_product,
				details_quantity: quantity,
				details_price: price,
				details_discount: 0,
				details_subtotal: subtotal,
				details_iva: iva,
				details_total: lineTotal,
				status: constants.STATUS_ACTIVE,
			},
		});

		added.push({ name: line.name, quantity });
	}

	if (!added.length) {
		throw new Error('Ningún producto de la orden está disponible actualmente');
	}

	const itemsCount = await recalculateCartTotals(targetCartId, id_user);

	return {
		id_shopping_car: targetCartId,
		itemsAdded: added.length,
		itemsCount,
		added,
		skipped,
	};
};

module.exports = {
	repeatOrderForUser,
};
