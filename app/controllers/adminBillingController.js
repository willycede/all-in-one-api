const billingSettingsModel = require('../models/billingSettings');
const response = require('../config/response');
const path = require('path');

const getSettings = async (req, res) => {
	try {
		const settings = await billingSettingsModel.getBillingSettingsForClient();
		return response.success(req, res, settings, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

const updateSettings = async (req, res) => {
	try {
		const updatedBy = req.userInfo && req.userInfo.id_users;
		const settings = await billingSettingsModel.updateBillingSettings(req.body, updatedBy);
		return response.success(req, res, settings, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

const uploadSignature = async (req, res) => {
	try {
		if (!req.file) {
			return response.error(req, res, { message: 'Archivo de firma requerido' }, 422);
		}

		const updatedBy = req.userInfo && req.userInfo.id_users;
		const signaturePath = path.resolve(req.file.path);
		const settings = await billingSettingsModel.updateSignaturePath(signaturePath, updatedBy);
		return response.success(req, res, settings, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

module.exports = {
	getSettings,
	updateSettings,
	uploadSignature,
};
