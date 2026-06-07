const { normalizeLocale } = require('../locale');

const BRAND = {
	primary: '#A96DFA',
	accent: '#CA1DFF',
	white: '#FFFFFF',
};

const COPY = {
	sp: {
		subject: (brand) => `${brand} - Autenticación en dos pasos activada`,
		adminSubject: (brand, customerName, email) => `${brand} - 2FA activado — ${customerName} (${email})`,
		title: 'Autenticación en dos pasos activada',
		greeting: (name) => `Hola <strong>${name}</strong>,`,
		p1: 'Confirmamos que la autenticación en dos pasos con aplicación de autenticación quedó <strong>activa</strong> en tu cuenta.',
		p2: 'A partir de ahora, cada vez que inicies sesión deberás ingresar el código de 6 dígitos de tu app (Google Authenticator, Authy, etc.).',
		p3: (count) => `Guarda tus <strong>${count} códigos de respaldo</strong> en un lugar seguro. Cada uno solo se puede usar una vez si pierdes acceso a tu app.`,
		p4: 'Si no fuiste tú, contacta soporte de inmediato.',
		cta: 'Ver configuración de seguridad',
		defaultCustomer: 'Usuario',
	},
	en: {
		subject: (brand) => `${brand} - Two-factor authentication enabled`,
		adminSubject: (brand, customerName, email) => `${brand} - 2FA enabled — ${customerName} (${email})`,
		title: 'Two-factor authentication enabled',
		greeting: (name) => `Hi <strong>${name}</strong>,`,
		p1: 'We confirm that app-based two-factor authentication is now <strong>active</strong> on your account.',
		p2: 'From now on, you will need to enter the 6-digit code from your app (Google Authenticator, Authy, etc.) when signing in.',
		p3: (count) => `Store your <strong>${count} backup codes</strong> in a safe place. Each can only be used once if you lose access to your app.`,
		p4: 'If this was not you, contact support immediately.',
		cta: 'View security settings',
		defaultCustomer: 'User',
	},
};

const buildTwoFactorEnabledEmailHtml = ({ locale, customerName, siteUrl, logoUrl, backupCodesCount }) => {
	const lang = normalizeLocale(locale);
	const t = COPY[lang];

	return `<!DOCTYPE html>
<html lang="${lang === 'en' ? 'en' : 'es'}">
<body style="margin:0;padding:0;background:#EDE8F8;font-family:Segoe UI,Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});padding:32px;text-align:center;">
            <img src="${logoUrl}" alt="All in One" width="160" style="margin-bottom:16px;">
            <h1 style="margin:0;color:${BRAND.white};font-size:24px;">${t.title}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;color:#4A4458;line-height:1.6;">
            <p>${t.greeting(customerName)}</p>
            <p>${t.p1}</p>
            <p>${t.p2}</p>
            <p>${t.p3(backupCodesCount)}</p>
            <p style="margin-top:24px;">${t.p4}</p>
            <p style="text-align:center;margin-top:28px;">
              <a href="${siteUrl}account/security" style="display:inline-block;background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:700;">
                ${t.cta}
              </a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

module.exports = {
	COPY,
	buildTwoFactorEnabledEmailHtml,
};
