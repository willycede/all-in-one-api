const { normalizeLocale } = require('../locale');

const BRAND = {
	primary: '#A96DFA',
	accent: '#CA1DFF',
	dark: '#1A1025',
	muted: '#6B6478',
	surface: '#F8F5FF',
	border: '#E8E0F5',
	white: '#FFFFFF',
};

const COPY = {
	sp: {
		subject: (brand, orderNumber) => `${brand} - Pedido #${orderNumber} cancelado`,
		adminSubject: (brand, orderNumber, customerName) => `${brand} - [Admin] Pedido #${orderNumber} cancelado — ${customerName}`,
		title: 'Pedido cancelado',
		titleAdminByAdmin: 'Pedido cancelado por administrador',
		titleAdminByClient: 'Pedido cancelado por el cliente',
		greeting: (name, orderNumber) => `Hola ${name}, tu orden #${orderNumber} fue cancelada correctamente.`,
		orderLabel: 'Orden',
		cancelDateLabel: 'Fecha de cancelación',
		totalLabel: 'Total del pedido',
		body: 'El enlace de pago asociado a este pedido ya no está activo. Si deseas comprar nuevamente, puedes repetir el pedido desde tu historial o agregar productos al carrito.',
		cta: 'Ver mis pedidos',
		footer: 'Este es un correo automático, por favor no respondas a este mensaje.',
		defaultCustomer: 'Cliente',
	},
	en: {
		subject: (brand, orderNumber) => `${brand} - Order #${orderNumber} cancelled`,
		adminSubject: (brand, orderNumber, customerName) => `${brand} - [Admin] Order #${orderNumber} cancelled — ${customerName}`,
		title: 'Order cancelled',
		titleAdminByAdmin: 'Order cancelled by administrator',
		titleAdminByClient: 'Order cancelled by customer',
		greeting: (name, orderNumber) => `Hi ${name}, your order #${orderNumber} was cancelled successfully.`,
		orderLabel: 'Order',
		cancelDateLabel: 'Cancellation date',
		totalLabel: 'Order total',
		body: 'The payment link for this order is no longer active. To buy again, repeat the order from your history or add products to your cart.',
		cta: 'View my orders',
		footer: 'This is an automated email, please do not reply.',
		defaultCustomer: 'Customer',
	},
};

const buildOrderCancellationEmailHtml = ({
	locale,
	siteUrl,
	logoUrl,
	customerName,
	orderNumber,
	date,
	total,
	titleOverride,
}) => {
	const lang = normalizeLocale(locale);
	const t = COPY[lang];

	return `<!DOCTYPE html>
<html lang="${lang === 'en' ? 'en' : 'es'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleOverride || t.title} — All in One</title>
</head>
<body style="margin:0;padding:0;background-color:#EDE8F8;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#EDE8F8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%);border-radius:20px 20px 0 0;padding:36px 32px 28px;text-align:center;">
              <img src="${logoUrl}" alt="All in One" width="180" style="display:block;margin:0 auto 20px;border:0;max-width:180px;height:auto;">
              <h1 style="margin:0;font-size:26px;color:${BRAND.white};font-weight:700;">${titleOverride || t.title}</h1>
              <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.92);">
                ${t.greeting(customerName, orderNumber)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.white};padding:32px 28px;border-radius:0 0 20px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.muted};font-weight:600;">${t.orderLabel}</p>
                    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:${BRAND.dark};">#${orderNumber}</p>
                    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.muted};font-weight:600;">${t.cancelDateLabel}</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#2D2640;">${date}</p>
                    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.muted};font-weight:600;">${t.totalLabel}</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:${BRAND.accent};">$${total}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4458;text-align:center;">
                ${t.body}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}account/order-history" style="display:inline-block;background:linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%);color:${BRAND.white};text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:999px;">
                      ${t.cta}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 16px 8px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9B93A8;line-height:1.5;">
                © 2026 All in One · Ecuador<br>
                ${t.footer}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

module.exports = {
	COPY,
	buildOrderCancellationEmailHtml,
};
