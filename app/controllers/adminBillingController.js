const fs = require('fs').promises;
const billingSettingsModel = require('../models/billingSettings');
const billingSignatureValidator = require('../helpers/billingSignatureValidator');
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

const getStoredCompanySettings = async () => {
	const settings = await billingSettingsModel.getBillingSettingsRow();
	billingSignatureValidator.assertCompanyProfileComplete(settings);
	return settings;
};

const validateSignatureUpload = async (req, res) => {
	let filePath = null;

	try {
		if (!req.file) {
			return response.error(req, res, { message: 'Archivo de firma requerido' }, 422);
		}

		const password = req.body.signature_password;
		if (password == null || String(password).length === 0) {
			return response.error(req, res, { message: 'La contraseña de la firma es requerida' }, 422);
		}

		filePath = path.resolve(req.file.path);
		const settings = await getStoredCompanySettings();

		const validation = await billingSignatureValidator.validateSignatureFile({
			filePath,
			password,
			companyRuc: settings.company_ruc,
			companyLegalName: settings.company_legal_name,
			companyTradeName: settings.company_trade_name,
		});

		return response.success(req, res, validation, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	} finally {
		if (filePath) {
			await fs.unlink(filePath).catch(() => {});
		}
	}
};

const uploadSignature = async (req, res) => {
	let filePath = null;

	try {
		if (!req.file) {
			return response.error(req, res, { message: 'Archivo de firma requerido' }, 422);
		}

		const password = req.body.signature_password;
		if (password == null || String(password).length === 0) {
			return response.error(req, res, { message: 'La contraseña de la firma es requerida' }, 422);
		}

		filePath = path.resolve(req.file.path);
		const settings = await getStoredCompanySettings();

		const validation = await billingSignatureValidator.validateSignatureFile({
			filePath,
			password,
			companyRuc: settings.company_ruc,
			companyLegalName: settings.company_legal_name,
			companyTradeName: settings.company_trade_name,
		});

		const updatedBy = req.userInfo && req.userInfo.id_users;
		const updatedSettings = await billingSettingsModel.updateSignaturePath(filePath, password, updatedBy);

		return response.success(req, res, {
			...updatedSettings,
			signature_validation: validation,
		}, 200);
	} catch (error) {
		if (filePath) {
			await fs.unlink(filePath).catch(() => {});
		}
		return response.error(req, res, { message: error.message }, 422);
	}
};

module.exports = {
	getSettings,
	updateSettings,
	validateSignatureUpload,
	uploadSignature,
};
