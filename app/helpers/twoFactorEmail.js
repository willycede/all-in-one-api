const { sendTransactionalEmail } = require('./transactionalEmail');

const BRAND = {
	primary: '#A96DFA',
	accent: '#CA1DFF',
	white: '#FFFFFF',
	muted: '#6B6478',
	dark: '#1A1025',
};

const buildTwoFactorEnabledEmailHtml = ({ customerName, siteUrl, logoUrl, backupCodesCount }) => `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#EDE8F8;font-family:Segoe UI,Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});padding:32px;text-align:center;">
            <img src="${logoUrl}" alt="All in One" width="160" style="margin-bottom:16px;">
            <h1 style="margin:0;color:${BRAND.white};font-size:24px;">Autenticación en dos pasos activada</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;color:#4A4458;line-height:1.6;">
            <p>Hola <strong>${customerName}</strong>,</p>
            <p>Confirmamos que la autenticación en dos pasos con aplicación de autenticación quedó <strong>activa</strong> en tu cuenta.</p>
            <p>A partir de ahora, cada vez que inicies sesión deberás ingresar el código de 6 dígitos de tu app (Google Authenticator, Authy, etc.).</p>
            <p>Guarda tus <strong>${backupCodesCount} códigos de respaldo</strong> en un lugar seguro. Cada uno solo se puede usar una vez si pierdes acceso a tu app.</p>
            <p style="margin-top:24px;">Si no fuiste tú, contacta soporte de inmediato.</p>
            <p style="text-align:center;margin-top:28px;">
              <a href="${siteUrl}account/security" style="display:inline-block;background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:700;">
                Ver configuración de seguridad
              </a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const sendTwoFactorEnabledEmail = async ({ user, backupCodesCount }) => {
	const siteUrl = (process.env.FRONTEND_URL || 'https://aioecuador.com').replace(/\/+$/, '') + '/';
	const logoUrl = `${siteUrl}static/images/logo/AIO_LOGO_NAME_ALL_WHITE.png`;
	const brandName = process.env.MAIL_BRAND_NAME || 'ALL IN ONE';
	const customerName = `${user.name_user || ''} ${user.last_name_user || ''}`.trim() || 'Usuario';

	await sendTransactionalEmail({
		to: user.email,
		name: customerName,
		subject: `${brandName} - Autenticación en dos pasos activada`,
		html: buildTwoFactorEnabledEmailHtml({
			customerName,
			siteUrl,
			logoUrl,
			backupCodesCount,
		}),
		notifyAdmin: true,
		adminSubject: `${brandName} - 2FA activado — ${customerName} (${user.email})`,
	});
};

module.exports = {
	sendTwoFactorEnabledEmail,
};
