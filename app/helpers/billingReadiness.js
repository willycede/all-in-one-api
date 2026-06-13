const fs = require('fs');
const { getEffectiveBillingConfig } = require('../models/billingSettings');
const { isCompanyProfileComplete } = require('./billingSignatureValidator');

const collectBillingReadinessIssues = async (configOverride) => {
	const config = configOverride || await getEffectiveBillingConfig();
	const issues = [];

	if (!config.is_billing_enabled) {
		issues.push('La facturación electrónica no está activada en administración');
	}

	if (!isCompanyProfileComplete(config)) {
		issues.push('Completa y guarda los datos del emisor (RUC, razón social, dirección y correo)');
	}

	if (!config.service_url) {
		issues.push('Falta la URL del servicio de facturación electrónica');
	}

	if (!config.output_path) {
		issues.push('Falta la ruta de salida de comprobantes PDF/XML');
	}

	if (!config.jasper_path) {
		issues.push('Falta la plantilla Jasper del comprobante');
	}

	if (!config.signature_path) {
		issues.push('No hay firma electrónica cargada');
	} else if (!fs.existsSync(config.signature_path)) {
		issues.push('El archivo de firma no existe en el servidor');
	}

	if (!config.signature_password) {
		issues.push('Falta la contraseña de la firma electrónica');
	}

	return {
		ready: issues.length === 0,
		issues,
		config,
	};
};

const assertBillingReadyForInvoicing = async (configOverride) => {
	const readiness = await collectBillingReadinessIssues(configOverride);

	if (!readiness.ready) {
		throw new Error(readiness.issues.join('. '));
	}

	return readiness.config;
};

module.exports = {
	collectBillingReadinessIssues,
	assertBillingReadyForInvoicing,
};
