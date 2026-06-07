const axios = require('axios');
const knex = require('../db/knex');
const { getOrderHistoryPaginated } = require('./order_history');

const generateElectronicInvoice = async (id_shopping_car) => {
	const shopCartFelec = await axios({
		method: 'post',
		url: process.env.URLAPIFELECTRONICA,
		headers: { 'Content-Type': 'application/json' },
		params: {
			codigo: id_shopping_car,
			path: process.env.PATHCOMPROBANTE,
			namefile: 'factura',
			jasper_file: process.env.PATHJASPER,
		},
	});

	return {
		claveAcceso: shopCartFelec.data.claveAcceso,
		pathPdf: shopCartFelec.data.pathPdf,
		pathXml: shopCartFelec.data.pathXml,
	};
};

const reprocessInvoiceForOrder = async (id_shopping_car) => {
	const order = await knex('shopping_car')
		.where({ id_shopping_car })
		.first();

	if (!order) {
		throw new Error('Orden no encontrada');
	}

	if (parseInt(order.status, 10) !== 3) {
		throw new Error('La orden debe estar pagada para reprocesar la factura');
	}

	await generateElectronicInvoice(id_shopping_car);

	await knex('shopping_car')
		.where({ id_shopping_car })
		.update({
			status_invoice: 1,
			updated_at: knex.fn.now(),
		});

	return knex('shopping_car')
		.where({ id_shopping_car })
		.first();
};

const reprocessOrderInvoice = async (id_shopping_car, id_user, page, limit) => {
	const order = await knex('shopping_car')
		.where({
			id_shopping_car,
			id_user,
		})
		.first();

	if (!order) {
		throw new Error('Orden no encontrada');
	}

	await reprocessInvoiceForOrder(id_shopping_car);

	return getOrderHistoryPaginated(id_user, page, limit);
};

module.exports = {
	reprocessOrderInvoice,
	reprocessInvoiceForOrder,
	generateElectronicInvoice,
};
