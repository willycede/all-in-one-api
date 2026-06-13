const knex = require('../db/knex');
const { isCompanyProfileComplete } = require('../helpers/billingSignatureValidator');

const SETTINGS_ID = 1;

const DEFAULTS = {
	environment: 'development',
	is_billing_enabled: false,
	company_ruc: null,
	company_legal_name: null,
	company_trade_name: null,
	company_address: null,
	company_email: null,
	establishment_code: '001',
	emission_point: '001',
	service_url: null,
	output_path: null,
	jasper_path: null,
	signature_path: null,
	signature_password: null,
};

const sanitizeForClient = (row) => {
	if (!row) {
		return { ...DEFAULTS, has_signature: false };
	}

	return {
		environment: row.environment || DEFAULTS.environment,
		is_billing_enabled: !!row.is_billing_enabled,
		company_ruc: row.company_ruc != null ? String(row.company_ruc) : '',
		company_legal_name: row.company_legal_name != null ? String(row.company_legal_name) : '',
		company_trade_name: row.company_trade_name != null ? String(row.company_trade_name) : '',
		company_address: row.company_address != null ? String(row.company_address) : '',
		company_email: row.company_email != null ? String(row.company_email) : '',
		establishment_code: row.establishment_code || '001',
		emission_point: row.emission_point || '001',
		service_url: row.service_url || process.env.URLAPIFELECTRONICA || '',
		output_path: row.output_path || process.env.PATHCOMPROBANTE || '',
		jasper_path: row.jasper_path || process.env.PATHJASPER || '',
		has_signature: !!row.signature_path,
		signature_file_name: row.signature_path ? row.signature_path.split(/[/\\]/).pop() : null,
		company_profile_complete: isCompanyProfileComplete(row),
		updated_at: row.updated_at,
	};
};

const getBillingSettingsRow = async () => {
	const row = await knex('billing_settings')
		.where({ id_billing_settings: SETTINGS_ID })
		.first();

	if (row) {
		return row;
	}

	await knex('billing_settings').insert({ id_billing_settings: SETTINGS_ID, ...DEFAULTS });
	return knex('billing_settings').where({ id_billing_settings: SETTINGS_ID }).first();
};

const getBillingSettings = async () => getBillingSettingsRow();

const getBillingSettingsForClient = async () => {
	const row = await getBillingSettingsRow();
	return sanitizeForClient(row);
};

const getEffectiveBillingConfig = async () => {
	const row = await getBillingSettingsRow();
	return {
		environment: row.environment || 'development',
		is_billing_enabled: !!row.is_billing_enabled,
		company_ruc: row.company_ruc,
		company_legal_name: row.company_legal_name,
		company_trade_name: row.company_trade_name,
		company_address: row.company_address,
		company_email: row.company_email,
		establishment_code: row.establishment_code || '001',
		emission_point: row.emission_point || '001',
		service_url: row.service_url || process.env.URLAPIFELECTRONICA,
		output_path: row.output_path || process.env.PATHCOMPROBANTE,
		jasper_path: row.jasper_path || process.env.PATHJASPER,
		signature_path: row.signature_path,
		signature_password: row.signature_password,
		ambiente: (row.environment === 'production') ? 2 : 1,
	};
};

const updateBillingSettings = async (payload, updatedBy) => {
	const data = {
		environment: payload.environment === 'production' ? 'production' : 'development',
		is_billing_enabled: !!payload.is_billing_enabled,
		company_ruc: payload.company_ruc || null,
		company_legal_name: payload.company_legal_name || null,
		company_trade_name: payload.company_trade_name || null,
		company_address: payload.company_address || null,
		company_email: payload.company_email || null,
		establishment_code: payload.establishment_code || '001',
		emission_point: payload.emission_point || '001',
		service_url: payload.service_url || null,
		output_path: payload.output_path || null,
		jasper_path: payload.jasper_path || null,
		updated_at: knex.fn.now(),
		updated_by: updatedBy || null,
	};

	if (payload.signature_password !== undefined && payload.signature_password !== '') {
		data.signature_password = payload.signature_password;
	}

	await knex('billing_settings')
		.where({ id_billing_settings: SETTINGS_ID })
		.update(data);

	return getBillingSettingsForClient();
};

const updateSignaturePath = async (signaturePath, signaturePassword, updatedBy) => {
	const data = {
		signature_path: signaturePath,
		updated_at: knex.fn.now(),
		updated_by: updatedBy || null,
	};

	if (signaturePassword) {
		data.signature_password = signaturePassword;
	}

	await knex('billing_settings')
		.where({ id_billing_settings: SETTINGS_ID })
		.update(data);

	return getBillingSettingsForClient();
};

module.exports = {
	getBillingSettings,
	getBillingSettingsRow,
	getBillingSettingsForClient,
	getEffectiveBillingConfig,
	updateBillingSettings,
	updateSignaturePath,
	sanitizeForClient,
};
