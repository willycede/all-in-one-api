const { normalizeLocale } = require('../locale');

const COPY = {
	sp: {
		subject: 'ALL IN ONE RECUPERACIÓN DE CLAVE',
		title: 'Recuperación de clave',
		intro: 'Estimado usuario, se ha cambiado su clave de acceso.',
		passwordLine: (password) => `Su nueva clave de acceso es <strong>${password}</strong>.`,
		advice: 'Le aconsejamos cambiar la clave en el apartado de configuraciones, perfil.',
	},
	en: {
		subject: 'ALL IN ONE PASSWORD RECOVERY',
		title: 'Password recovery',
		intro: 'Dear user, your access password has been reset.',
		passwordLine: (password) => `Your new password is <strong>${password}</strong>.`,
		advice: 'We recommend changing your password in account settings.',
	},
};

const buildPasswordRecoveryEmailHtml = ({ locale, newPassword }) => {
	const lang = normalizeLocale(locale);
	const t = COPY[lang];

	return `<!DOCTYPE html>
<html lang="${lang === 'en' ? 'en' : 'es'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin:0;padding:24px;font-family:Segoe UI,Roboto,Arial,sans-serif;background:#F8F5FF;color:#2D2640;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #E8E0F5;">
    <h2 style="margin:0 0 16px;color:#1A1025;">${t.title}</h2>
    <p style="line-height:1.6;">${t.intro}</p>
    <p style="line-height:1.6;">${t.passwordLine(newPassword)}</p>
    <p style="line-height:1.6;margin-bottom:0;">${t.advice}</p>
  </div>
</body>
</html>`;
};

module.exports = {
	COPY,
	buildPasswordRecoveryEmailHtml,
};
