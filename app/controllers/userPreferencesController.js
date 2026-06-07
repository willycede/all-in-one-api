const userPreferencesModel = require('../models/userPreferences');
const response = require('../config/response');

const ALLOWED_LOCALES = ['en', 'sp', 'fr', 'jp', 'gr'];
const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP'];

const getPreferences = async (req, res) => {
	try {
		const idUsers = parseInt(req.params.id_user, 10);
		const prefs = await userPreferencesModel.getPreferencesByUser(idUsers);
		return response.success(req, res, prefs, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

const updatePreferences = async (req, res) => {
	try {
		const idUsers = parseInt(req.body.id_user || req.userInfo.id_users, 10);
		const body = req.body || {};

		if (body.locale && !ALLOWED_LOCALES.includes(body.locale)) {
			return response.error(req, res, { message: 'Idioma no soportado' }, 422);
		}

		if (body.currency && !ALLOWED_CURRENCIES.includes(body.currency)) {
			return response.error(req, res, { message: 'Moneda no soportada' }, 422);
		}

		const prefs = await userPreferencesModel.upsertPreferences(idUsers, body);
		return response.success(req, res, prefs, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

module.exports = {
	getPreferences,
	updatePreferences,
	ALLOWED_LOCALES,
	ALLOWED_CURRENCIES,
};
