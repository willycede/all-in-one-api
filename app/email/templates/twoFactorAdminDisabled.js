const { normalizeLocale } = require('../locale');

const BRAND = {
	primary: '#A96DFA',
	accent: '#CA1DFF',
	white: '#FFFFFF',
	warning: '#B45309',
	muted: '#6B6478',
	dark: '#4A4458',
};

const COPY = {
	sp: {
		userSubject: (brand) => `${brand} - Autenticación en dos pasos desactivada`,
		adminSubject: (brand, customerName, email) => `${brand} - 2FA desactivado por admin — ${customerName} (${email})`,
		cliAdminSubject: (brand, customerName, email) => `${brand} - 2FA desactivado por script — ${customerName} (${email})`,
		userTitle: 'Autenticación en dos pasos desactivada',
		adminTitle: '2FA desactivado — notificación administrativa',
		greeting: (name) => `Hola <strong>${name}</strong>,`,
		userP1: 'Te informamos que la <strong>autenticación en dos pasos (2FA)</strong> de tu cuenta fue desactivada por un administrador de All In One.',
		userP1Cli: 'Te informamos que la <strong>autenticación en dos pasos (2FA)</strong> de tu cuenta fue desactivada por el equipo técnico de All In One.',
		userP2: 'Ya puedes iniciar sesión solo con tu correo y contraseña. Te recomendamos volver a activar el 2FA en cuanto sea posible para proteger tu cuenta.',
		userP3: (reason) => reason
			? `Motivo registrado: <em>${reason}</em>`
			: 'Si no solicitaste este cambio, contacta a soporte de inmediato.',
		userP4: 'Si no reconoces esta acción, cambia tu contraseña y vuelve a activar el 2FA desde tu cuenta.',
		adminIntro: 'Un administrador desactivó el 2FA de un usuario desde el panel.',
		cliIntro: 'El 2FA de un usuario fue desactivado mediante el script CLI.',
		adminUserLabel: 'Usuario afectado',
		adminActorLabel: 'Administrador',
		adminSourceLabel: 'Origen',
		adminReasonLabel: 'Motivo',
		adminStateLabel: 'Estado previo',
		adminDateLabel: 'Fecha',
		sourcePanel: 'Panel de administración',
		sourceCli: 'Script CLI',
		stateEnabled: '2FA activo',
		statePending: 'Configuración pendiente',
		stateOff: 'Sin 2FA',
		cta: 'Ir a seguridad de la cuenta',
		adminCta: 'Ver registro de eventos',
		defaultCustomer: 'Usuario',
		notProvided: 'No indicado',
		systemActor: 'Sistema / script CLI',
	},
	en: {
		userSubject: (brand) => `${brand} - Two-factor authentication disabled`,
		adminSubject: (brand, customerName, email) => `${brand} - 2FA disabled by admin — ${customerName} (${email})`,
		cliAdminSubject: (brand, customerName, email) => `${brand} - 2FA disabled by script — ${customerName} (${email})`,
		userTitle: 'Two-factor authentication disabled',
		adminTitle: '2FA disabled — admin notification',
		greeting: (name) => `Hi <strong>${name}</strong>,`,
		userP1: 'We inform you that <strong>two-factor authentication (2FA)</strong> on your account was disabled by an All In One administrator.',
		userP1Cli: 'We inform you that <strong>two-factor authentication (2FA)</strong> on your account was disabled by the All In One technical team.',
		userP2: 'You can now sign in with your email and password only. We recommend re-enabling 2FA as soon as possible to protect your account.',
		userP3: (reason) => reason
			? `Recorded reason: <em>${reason}</em>`
			: 'If you did not request this change, contact support immediately.',
		userP4: 'If you do not recognize this action, change your password and re-enable 2FA from your account.',
		adminIntro: 'An administrator disabled a user\'s 2FA from the admin panel.',
		cliIntro: 'A user\'s 2FA was disabled via the CLI script.',
		adminUserLabel: 'Affected user',
		adminActorLabel: 'Administrator',
		adminSourceLabel: 'Source',
		adminReasonLabel: 'Reason',
		adminStateLabel: 'Previous state',
		adminDateLabel: 'Date',
		sourcePanel: 'Admin panel',
		sourceCli: 'CLI script',
		stateEnabled: '2FA active',
		statePending: 'Pending setup',
		stateOff: 'No 2FA',
		cta: 'Go to account security',
		adminCta: 'View event log',
		defaultCustomer: 'User',
		notProvided: 'Not provided',
		systemActor: 'System / CLI script',
	},
};

const escapeHtml = (value) => String(value || '')
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;');

const buildPreviousState = (t, { wasEnabled, hadPending }) => {
	if (wasEnabled) return t.stateEnabled;
	if (hadPending) return t.statePending;
	return t.stateOff;
};

const buildTwoFactorAdminDisabledUserHtml = ({
	locale,
	customerName,
	siteUrl,
	logoUrl,
	reason,
	supportEmail,
	source = 'admin_panel',
}) => {
	const lang = normalizeLocale(locale);
	const t = COPY[lang];
	const intro = source === 'cli' ? t.userP1Cli : t.userP1;

	return `<!DOCTYPE html>
<html lang="${lang === 'en' ? 'en' : 'es'}">
<body style="margin:0;padding:0;background:#EDE8F8;font-family:Segoe UI,Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});padding:32px;text-align:center;">
            <img src="${logoUrl}" alt="All in One" width="160" style="margin-bottom:16px;">
            <h1 style="margin:0;color:${BRAND.white};font-size:24px;">${t.userTitle}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;color:${BRAND.dark};line-height:1.6;">
            <p>${t.greeting(escapeHtml(customerName))}</p>
            <p>${intro}</p>
            <p>${t.userP2}</p>
            <p style="color:${BRAND.warning};">${t.userP3(reason ? escapeHtml(reason) : null)}</p>
            <p>${t.userP4}</p>
            ${supportEmail ? `<p style="font-size:14px;color:${BRAND.muted};">Soporte: <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a></p>` : ''}
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

const buildTwoFactorAdminDisabledAdminHtml = ({
	locale = 'sp',
	siteUrl,
	customerName,
	customerEmail,
	actorName,
	actorEmail,
	reason,
	wasEnabled,
	hadPending,
	dateLabel,
	source = 'admin_panel',
}) => {
	const lang = normalizeLocale(locale);
	const t = COPY[lang];
	const intro = source === 'cli' ? t.cliIntro : t.adminIntro;
	const actor = source === 'cli' ? t.systemActor : `${escapeHtml(actorName || t.notProvided)} (${escapeHtml(actorEmail || t.notProvided)})`;
	const sourceLabel = source === 'cli' ? t.sourceCli : t.sourcePanel;

	return `<!DOCTYPE html>
<html lang="${lang === 'en' ? 'en' : 'es'}">
<body style="margin:0;padding:24px;background:#F8F5FF;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #E8E0F5;overflow:hidden;">
    <div style="padding:20px 24px;background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});color:#fff;">
      <h1 style="margin:0;font-size:20px;">${t.adminTitle}</h1>
    </div>
    <div style="padding:24px;color:${BRAND.dark};line-height:1.55;">
      <p style="margin:0 0 16px;">${intro}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:${BRAND.muted};width:38%;">${t.adminUserLabel}</td><td style="padding:8px 0;"><strong>${escapeHtml(customerName)}</strong><br>${escapeHtml(customerEmail)}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.muted};">${t.adminActorLabel}</td><td style="padding:8px 0;">${actor}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.muted};">${t.adminSourceLabel}</td><td style="padding:8px 0;">${sourceLabel}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.muted};">${t.adminStateLabel}</td><td style="padding:8px 0;">${buildPreviousState(t, { wasEnabled, hadPending })}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.muted};">${t.adminReasonLabel}</td><td style="padding:8px 0;">${reason ? escapeHtml(reason) : t.notProvided}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.muted};">${t.adminDateLabel}</td><td style="padding:8px 0;">${escapeHtml(dateLabel)}</td></tr>
      </table>
      <p style="text-align:center;margin-top:24px;">
        <a href="${siteUrl}admin-panel/audit-logs" style="display:inline-block;background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700;">
          ${t.adminCta}
        </a>
      </p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = {
	COPY,
	buildTwoFactorAdminDisabledUserHtml,
	buildTwoFactorAdminDisabledAdminHtml,
};
