const fs = require('fs');
const path = require('path');
const { inspectSignatureFile } = require('./billingSignatureValidator');
const { resolveSignatureDeployDirectory } = require('./billingSignatureDeploy');

const maskSecret = (value) => {
	if (!value) return false;
	const text = String(value);
	if (text.length <= 2) return '**';
	return `${'*'.repeat(Math.min(text.length, 8))} (${text.length} caracteres)`;
};

const buildInvoiceServiceParams = (config, orderId) => ({
	codigo: orderId,
	path: config.output_path,
	namefile: 'factura',
	jasper_file: config.jasper_path || '',
	ambiente: config.ambiente,
	ruc: config.company_ruc,
	razonSocial: config.company_legal_name,
	nombreComercial: config.company_trade_name,
	dirMatriz: config.company_address,
	firma: config.signature_path,
	claveFirma: config.signature_password,
	establecimiento: config.establishment_code || '001',
	puntoEmision: config.emission_point || '001',
});

const buildInvoicePayloadSummary = async (config, orderId) => {
	const signaturePath = config.signature_path ? path.resolve(config.signature_path) : null;
	const deployPath = resolveSignatureDeployDirectory(config.signature_deploy_path);
	const warnings = [];

	if (!signaturePath) {
		warnings.push('No hay ruta de firma configurada. El servicio Java puede usar un certificado por defecto.');
	} else if (!fs.existsSync(signaturePath)) {
		warnings.push(`El archivo de firma no existe en el servidor API: ${signaturePath}`);
	}

	if (deployPath && signaturePath && !signaturePath.startsWith(path.resolve(deployPath))) {
		warnings.push(
			`La firma activa no está en la ruta de despliegue (${deployPath}). Vuelve a subir el certificado.`,
		);
	}

	let signatureInspection = null;
	if (signaturePath && fs.existsSync(signaturePath) && config.signature_password) {
		try {
			signatureInspection = await inspectSignatureFile({
				filePath: signaturePath,
				password: config.signature_password,
			});
			if (signatureInspection.isExpired) {
				warnings.push(
					`El certificado en ${signaturePath} está vencido desde ${signatureInspection.validTo}.`,
				);
			}
		} catch (error) {
			warnings.push(`No se pudo inspeccionar la firma configurada: ${error.message}`);
		}
	}

	return {
		orderId,
		serviceUrl: config.service_url,
		params: {
			codigo: orderId,
			path: config.output_path,
			namefile: 'factura',
			jasper_file: config.jasper_path || '',
			jasper_configured: !!config.jasper_path,
			pdf_engine: 'native',
			ambiente: config.ambiente,
			ruc: config.company_ruc,
			razonSocial: config.company_legal_name,
			nombreComercial: config.company_trade_name,
			dirMatriz: config.company_address,
			establecimiento: config.establishment_code || '001',
			puntoEmision: config.emission_point || '001',
			firma: signaturePath,
			firma_exists: !!(signaturePath && fs.existsSync(signaturePath)),
			claveFirma_configured: !!config.signature_password,
			claveFirma_preview: maskSecret(config.signature_password),
		},
		wildflyDeployPath: deployPath,
		signatureInspection,
		warnings,
	};
};

const logInvoicePayloadSummary = async (config, orderId) => {
	const summary = await buildInvoicePayloadSummary(config, orderId);
	console.log('[invoice-service] Payload hacia servicio de facturación:', JSON.stringify(summary));
	return summary;
};

module.exports = {
	buildInvoiceServiceParams,
	buildInvoicePayloadSummary,
	logInvoicePayloadSummary,
};
