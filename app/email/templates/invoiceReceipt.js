const { normalizeLocale } = require('../locale');

const BRAND = {
	primary: '#A96DFA',
	accent: '#CA1DFF',
	dark: '#1A1025',
	muted: '#6B6478',
	white: '#FFFFFF',
};

const COPY = {
	sp: {
		subject: (brand, orderNumber) => `${brand} - Factura #${orderNumber}`,
		title: 'Factura electrónica',
		greeting: (name, orderNumber) => `Hola <strong>${name}</strong>, adjuntamos tu comprobante de la orden <strong>#${orderNumber}</strong>.`,
		documentLabel: 'Documento',
		totalLabel: 'Total',
		accessKeyLabel: 'Clave de acceso',
		attachments: 'Los archivos PDF y XML van adjuntos a este correo.',
	},
	en: {
		subject: (brand, orderNumber) => `${brand} - Invoice #${orderNumber}`,
		title: 'Electronic invoice',
		greeting: (name, orderNumber) => `Hi <strong>${name}</strong>, please find your receipt for order <strong>#${orderNumber}</strong>.`,
		documentLabel: 'Document',
		totalLabel: 'Total',
		accessKeyLabel: 'Access key',
		attachments: 'PDF and XML files are attached to this email.',
	},
};

const buildInvoiceReceiptEmailHtml = ({
	locale,
	customerName,
	orderNumber,
	invoiceNumber,
	accessKey,
	total,
}) => {
	const lang = normalizeLocale(locale);
	const t = COPY[lang];

	return `<!DOCTYPE html>
<html lang="${lang === 'en' ? 'en' : 'es'}">
<body style="margin:0;padding:24px;font-family:Segoe UI,Roboto,Arial,sans-serif;background:#F8F5FF;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #E8E0F5;">
    <div style="margin-bottom:18px;padding-bottom:16px;border-bottom:1px solid #E8E0F5;">
      <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});color:${BRAND.white};font-size:12px;font-weight:700;">All in One</span>
    </div>
    <h2 style="margin:0 0 12px;color:${BRAND.dark};">${t.title}</h2>
    <p style="line-height:1.6;color:#4A4458;">${t.greeting(customerName, orderNumber)}</p>
    <p style="line-height:1.6;color:#4A4458;">
      <strong>${t.documentLabel}:</strong> ${invoiceNumber}<br>
      <strong>${t.totalLabel}:</strong> $${total}<br>
      <strong>${t.accessKeyLabel}:</strong> ${accessKey}
    </p>
    <p style="line-height:1.6;color:${BRAND.muted};margin-bottom:0;">${t.attachments}</p>
  </div>
</body>
</html>`;
};

module.exports = {
	COPY,
	buildInvoiceReceiptEmailHtml,
};
