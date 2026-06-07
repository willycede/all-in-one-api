const { sendTransactionalEmail } = require('./transactionalEmail');
const orderEmailDebug = require('./orderEmailDebug');

const BRAND = {
	primary: '#A96DFA',
	accent: '#CA1DFF',
	dark: '#1A1025',
	muted: '#6B6478',
	surface: '#F8F5FF',
	border: '#E8E0F5',
	white: '#FFFFFF',
};

const buildOrderCancellationEmailHtml = ({
	siteUrl,
	logoUrl,
	customerName,
	orderNumber,
	date,
	total,
}) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido cancelado — All in One</title>
</head>
<body style="margin:0;padding:0;background-color:#EDE8F8;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#EDE8F8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%);border-radius:20px 20px 0 0;padding:36px 32px 28px;text-align:center;">
              <img src="${logoUrl}" alt="All in One" width="180" style="display:block;margin:0 auto 20px;border:0;max-width:180px;height:auto;">
              <h1 style="margin:0;font-size:26px;color:${BRAND.white};font-weight:700;">Pedido cancelado</h1>
              <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.92);">
                Hola ${customerName}, tu orden #${orderNumber} fue cancelada correctamente.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.white};padding:32px 28px;border-radius:0 0 20px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.muted};font-weight:600;">Orden</p>
                    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:${BRAND.dark};">#${orderNumber}</p>
                    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.muted};font-weight:600;">Fecha de cancelación</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#2D2640;">${date}</p>
                    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.muted};font-weight:600;">Total del pedido</p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:${BRAND.accent};">$${total}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4458;text-align:center;">
                El enlace de pago asociado a este pedido ya no está activo. Si deseas comprar nuevamente,
                puedes repetir el pedido desde tu historial o agregar productos al carrito.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}account/order-history" style="display:inline-block;background:linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%);color:${BRAND.white};text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:999px;">
                      Ver mis pedidos
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
                Este es un correo automático, por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const sendOrderCancelledEmail = async ({ user, order, cancelledByAdmin = false }) => {
	const siteUrl = (process.env.FRONTEND_URL || 'https://aioecuador.com').replace(/\/+$/, '') + '/';
	const logoUrl = `${siteUrl}static/images/logo/AIO_LOGO_NAME_ALL_WHITE.png`;
	const brandName = process.env.MAIL_BRAND_NAME || 'ALL IN ONE';
	const customerName = `${user.name_user || ''} ${user.last_name_user || ''}`.trim() || 'Cliente';
	const orderNumber = String(order.id_shopping_car);
	const date = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
	const total = parseFloat(order.shopping_car_total || 0).toFixed(2);

	const html = buildOrderCancellationEmailHtml({
		siteUrl,
		logoUrl,
		customerName,
		orderNumber,
		date,
		total,
	});

	await sendTransactionalEmail({
		to: user.email,
		name: customerName,
		subject: `${brandName} - Pedido #${orderNumber} cancelado`,
		html,
	});

	if (process.env.ADMIN_EMAILS) {
		const adminHtml = buildOrderCancellationEmailHtml({
			siteUrl,
			logoUrl,
			customerName: `[ADMIN] ${customerName}`,
			orderNumber,
			date,
			total,
		}).replace(
			'Pedido cancelado',
			cancelledByAdmin ? 'Pedido cancelado por administrador' : 'Pedido cancelado por el cliente'
		);

		await sendTransactionalEmail({
			to: process.env.ADMIN_EMAILS.split(',')[0].trim(),
			name: 'Administración',
			subject: `${brandName} - [Admin] Pedido #${orderNumber} cancelado — ${customerName}`,
			html: adminHtml,
		});
	}
};

const trySendOrderCancelledEmail = async ({ user, order, cancelledByAdmin = false }) => {
	try {
		await sendOrderCancelledEmail({ user, order, cancelledByAdmin });
	} catch (error) {
		orderEmailDebug.logOrderEmailApiError('order-cancel:email', error);
	}
};

module.exports = {
	buildOrderCancellationEmailHtml,
	sendOrderCancelledEmail,
	trySendOrderCancelledEmail,
};
