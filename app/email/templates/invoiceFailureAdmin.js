const BRAND = {
	primary: '#A96DFA',
	dark: '#1A1025',
	muted: '#6B6478',
	surface: '#F8F5FF',
	border: '#E8E0F5',
	white: '#FFFFFF',
	warning: '#B45309',
	accent: '#CA1DFF',
};

const COPY = {
	sp: {
		subject: (brand, count) => `${brand} - ${count} factura(s) con error`,
		subjectSingle: (brand, orderId) => `${brand} - Error de factura en orden #${orderId}`,
		title: 'Alerta de facturación',
		intro: 'Se detectaron pedidos pagados que no pudieron facturarse automáticamente.',
		orderLabel: 'Orden',
		errorLabel: 'Error',
		action: 'Revisa el panel de facturas y usa Reprocesar si corresponde.',
		footer: 'Correo automático del marketplace All In One.',
	},
	en: {
		subject: (brand, count) => `${brand} - ${count} invoice failure(s)`,
		subjectSingle: (brand, orderId) => `${brand} - Invoice error on order #${orderId}`,
		title: 'Billing alert',
		intro: 'Paid orders were found that could not be invoiced automatically.',
		orderLabel: 'Order',
		errorLabel: 'Error',
		action: 'Review the invoices panel and use Reprocess when appropriate.',
		footer: 'Automated email from the All In One marketplace.',
	},
};

const buildInvoiceFailureAdminHtml = ({ locale, orders }) => {
	const lang = locale === 'en' ? 'en' : 'sp';
	const t = COPY[lang];
	const brandName = process.env.MAIL_BRAND_NAME || 'ALL IN ONE';
	const rows = (orders || []).map((order) => `
		<tr>
			<td style="padding:8px 12px;border-bottom:1px solid ${BRAND.border};">#${order.id_shopping_car}</td>
			<td style="padding:8px 12px;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};">${order.invoice_error || '—'}</td>
		</tr>
	`).join('');

	return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:${BRAND.surface};font-family:Arial,sans-serif;">
		<div style="max-width:560px;margin:0 auto;background:${BRAND.white};border-radius:12px;border:1px solid ${BRAND.border};overflow:hidden;">
			<div style="padding:20px 24px;background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});color:white;">
				<h1 style="margin:0;font-size:20px;">${t.title}</h1>
			</div>
			<div style="padding:24px;color:${BRAND.dark};">
				<p style="margin:0 0 16px;line-height:1.5;">${t.intro}</p>
				<table style="width:100%;border-collapse:collapse;font-size:14px;">
					<thead>
						<tr>
							<th style="text-align:left;padding:8px 12px;color:${BRAND.muted};">${t.orderLabel}</th>
							<th style="text-align:left;padding:8px 12px;color:${BRAND.muted};">${t.errorLabel}</th>
						</tr>
					</thead>
					<tbody>${rows}</tbody>
				</table>
				<p style="margin:16px 0 0;color:${BRAND.warning};font-size:14px;">${t.action}</p>
			</div>
			<div style="padding:16px 24px;background:${BRAND.surface};font-size:12px;color:${BRAND.muted};">${t.footer}</div>
		</div>
	</body></html>`;
};

module.exports = {
	COPY,
	buildInvoiceFailureAdminHtml,
};
