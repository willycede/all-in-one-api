const axios = require('axios');
const knex = require('../db/knex');
const { getOrderHistoryPaginated } = require('./order_history');

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

	if (parseInt(order.status, 10) !== 3) {
		throw new Error('La orden debe estar pagada para reprocesar la factura');
	}

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

	const clave = shopCartFelec.data.claveAcceso;
	const pathpdf = shopCartFelec.data.pathPdf;
	const pathxml = shopCartFelec.data.pathXml;

	const userResponse = await knex('users')
		.where({ id_users: id_user, status: 1 })
		.first();

	if (!userResponse) {
		throw new Error('Usuario no encontrado');
	}

	await knex('shopping_car')
		.where({ id_shopping_car })
		.update({
			status_invoice: 1,
			updated_at: knex.fn.now(),
		});

	return getOrderHistoryPaginated(id_user, page, limit);
};

module.exports = {
	reprocessOrderInvoice,
};
