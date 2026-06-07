const knex = require('../db/knex');

const DEFAULT_PREFERENCES = {
	locale: 'sp',
	currency: 'USD',
	use_delivery_on_orders: false,
	default_delivery_address: null,
	default_delivery_recipient: null,
	default_delivery_phone: null,
};

const getPreferencesByUser = async (idUsers) => {
	const row = await knex('user_preferences')
		.where({ id_users: idUsers })
		.first();

	if (!row) {
		return { id_users: idUsers, ...DEFAULT_PREFERENCES };
	}

	return row;
};

const upsertPreferences = async (idUsers, payload) => {
	const existing = await knex('user_preferences')
		.where({ id_users: idUsers })
		.first();

	const data = {
		locale: payload.locale || DEFAULT_PREFERENCES.locale,
		currency: payload.currency || DEFAULT_PREFERENCES.currency,
		use_delivery_on_orders: !!payload.use_delivery_on_orders,
		default_delivery_address: payload.default_delivery_address || null,
		default_delivery_recipient: payload.default_delivery_recipient || null,
		default_delivery_phone: payload.default_delivery_phone || null,
		updated_at: knex.fn.now(),
	};

	if (existing) {
		await knex('user_preferences')
			.where({ id_users: idUsers })
			.update(data);
	} else {
		await knex('user_preferences').insert({
			id_users: idUsers,
			...data,
			created_at: knex.fn.now(),
		});
	}

	return getPreferencesByUser(idUsers);
};

module.exports = {
	getPreferencesByUser,
	upsertPreferences,
	DEFAULT_PREFERENCES,
};
