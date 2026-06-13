#!/usr/bin/env node
/**
 * Muestra exactamente qué parámetros enviaría el API al servicio Java de facturación.
 *
 * Uso en servidor:
 *   node app/db/scripts/verify_billing_invoice_payload.js
 *   node app/db/scripts/verify_billing_invoice_payload.js 12345
 */
require('dotenv').config();
const { getEffectiveBillingConfig } = require('../../models/billingSettings');
const { buildInvoicePayloadSummary } = require('../../helpers/billingInvoicePayload');
const { buildInvoiceServiceParams } = require('../../helpers/billingInvoicePayload');

const orderId = process.argv[2] || 'EJEMPLO_ORDEN';

async function main() {
	const config = await getEffectiveBillingConfig();
	const summary = await buildInvoicePayloadSummary(config, orderId);
	const params = buildInvoiceServiceParams(config, orderId);

	console.log('=== Configuración efectiva de facturación ===');
	console.log(JSON.stringify({
		service_url: config.service_url,
		signature_path: config.signature_path,
		signature_deploy_path: config.signature_deploy_path,
		signature_password_length: config.signature_password ? String(config.signature_password).length : 0,
		company_ruc: config.company_ruc,
		is_billing_enabled: config.is_billing_enabled,
	}, null, 2));

	console.log('\n=== Parámetros que se envían al servicio Java ===');
	console.log(JSON.stringify({
		...params,
		claveFirma: params.claveFirma ? `[configurada, ${String(params.claveFirma).length} caracteres]` : null,
	}, null, 2));

	console.log('\n=== Diagnóstico ===');
	console.log(JSON.stringify(summary, null, 2));

	if (summary.warnings && summary.warnings.length) {
		console.log('\n⚠ Advertencias:');
		summary.warnings.forEach((warning) => console.log(`- ${warning}`));
		process.exitCode = 1;
		return;
	}

	console.log('\n✓ Sin advertencias. La ruta y el certificado configurados en BD parecen correctos.');
	console.log('  Si WildFly sigue fallando, prueba la URL directamente con curl (ver README o soporte).');
}

main().catch((error) => {
	console.error('[verify-billing-invoice] ERROR:', error.message);
	process.exit(1);
});
