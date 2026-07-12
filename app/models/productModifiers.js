//Import necessary libraries
const generalConstants = require('../constants/constants')
const knex = require('../db/knex')

const getModifiersByProductId = async (id_products) => {
	return knex('product_modifiers')
		.where({ id_products, status: generalConstants.STATUS_ACTIVE })
		.orderBy('name', 'asc');
};

const getActiveModifierForProduct = async (id_modifier, id_products) => {
	return knex('product_modifiers')
		.where({ id_modifier, id_products, status: generalConstants.STATUS_ACTIVE })
		.first();
};

const sanitizeModifiers = (modifiers) => (Array.isArray(modifiers) ? modifiers : [])
	.map((modifier) => ({
		type: (modifier.type && String(modifier.type).trim()) || 'color',
		name: modifier.name ? String(modifier.name).trim() : '',
		price_delta: parseFloat(modifier.price_delta),
	}))
	.filter((modifier) => modifier.name
		&& Number.isFinite(modifier.price_delta)
		&& modifier.price_delta >= 0);

/*
 * Reemplaza los modificadores de un producto conservando los id_modifier de los
 * que siguen existiendo (por nombre + tipo), para no invalidar carritos activos.
 */
const replaceProductModifiers = async (id_products, modifiers) => {
	const cleanModifiers = sanitizeModifiers(modifiers);
	const existing = await knex('product_modifiers').where({ id_products });
	const keptIds = [];

	for (let i = 0; i < cleanModifiers.length; i += 1) {
		const modifier = cleanModifiers[i];
		const match = existing.find((row) => row.type === modifier.type
			&& String(row.name).toLowerCase() === modifier.name.toLowerCase());

		if (match) {
			await knex('product_modifiers')
				.where({ id_modifier: match.id_modifier })
				.update({
					name: modifier.name,
					price_delta: modifier.price_delta,
					status: generalConstants.STATUS_ACTIVE,
					updated_at: knex.fn.now(),
				});
			keptIds.push(match.id_modifier);
		} else {
			const inserted = await knex('product_modifiers').insert({
				id_products,
				type: modifier.type,
				name: modifier.name,
				price_delta: modifier.price_delta,
				status: generalConstants.STATUS_ACTIVE,
				created_at: knex.fn.now(),
			});
			keptIds.push(inserted[0]);
		}
	}

	let deactivateQuery = knex('product_modifiers').where({ id_products });
	if (keptIds.length > 0) {
		deactivateQuery = deactivateQuery.whereNotIn('id_modifier', keptIds);
	}
	await deactivateQuery.update({
		status: generalConstants.STATUS_INACTIVE,
		updated_at: knex.fn.now(),
	});

	return getModifiersByProductId(id_products);
};

module.exports = {
	getModifiersByProductId,
	getActiveModifierForProduct,
	replaceProductModifiers,
	sanitizeModifiers,
};
