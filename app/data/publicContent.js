/**
 * Contenido público del sitio (contacto, legales, FAQ).
 * Datos alineados con los PDF oficiales en /legal/v1/
 */
const company = {
	legalName: 'ALLIN ONEC S.A.',
	tradeName: 'All in One',
	ruc: '0993401117001',
	legalAddress: 'Calle Tercera N.° 116 y Calle E, Ciudadela Nueva, Ecuador',
	supportEmail: 'soporte@allinone.com',
	dataProtectionEmail: 'azavala@aioecuador.com',
	phone: '+593 00 000 0000',
	website: 'aioecuador.com',
	country: 'Ecuador',
};

const contact = {
	info: 'Si tienes dudas sobre pedidos, pagos, privacidad o tu cuenta, contáctanos. Para asuntos relacionados con datos personales puedes escribir directamente a nuestro responsable de tratamiento.',
	call: company.phone,
	mail: company.supportEmail,
	dataProtectionEmail: company.dataProtectionEmail,
	legalName: company.legalName,
	ruc: company.ruc,
	address: company.legalAddress,
	map: {
		lat: -2.1452,
		lng: -79.8862,
		zoom: 15,
	},
};

const privacyPolicy = [
	{
		name: 'I. Responsable del tratamiento de los datos personales',
		content: `
			<p><strong>${company.legalName}</strong>, sociedad constituida en la República del Ecuador, es la responsable del tratamiento de los datos personales que recopila a través de la plataforma <strong>${company.website}</strong> y sus servicios asociados.</p>
			<p>Esta política se expide en cumplimiento de la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP)</strong> y normativa conexa vigente en Ecuador.</p>
		`,
	},
	{
		name: 'II. Información del responsable del tratamiento',
		content: `
			<ul>
				<li><strong>Razón social:</strong> ${company.legalName}</li>
				<li><strong>RUC:</strong> ${company.ruc}</li>
				<li><strong>Domicilio legal:</strong> ${company.legalAddress}</li>
				<li><strong>Correo de soporte:</strong> <a href="mailto:${company.supportEmail}">${company.supportEmail}</a></li>
				<li><strong>Correo para tratamiento de datos:</strong> <a href="mailto:${company.dataProtectionEmail}">${company.dataProtectionEmail}</a></li>
			</ul>
		`,
	},
	{
		name: 'III. Documentos oficiales',
		content: `
			<p>Los documentos legales vigentes se publican en PDF y son los mismos que aceptas al crear tu cuenta:</p>
			<ul>
				<li>Política de Tratamiento de Datos Personales</li>
				<li>Consentimiento para el Tratamiento de Datos Personales</li>
			</ul>
			<p>Puedes consultarlos y descargarlos desde esta página o durante el registro en la plataforma.</p>
		`,
	},
	{
		name: 'IV. Datos que recopilamos',
		content: `
			<p>Podemos recopilar, entre otros, los siguientes datos:</p>
			<ul>
				<li>Datos de identificación: nombre, correo electrónico, teléfono e identificación cuando aplique.</li>
				<li>Datos de cuenta: credenciales, preferencias e historial de pedidos.</li>
				<li>Datos de transacción: productos adquiridos, montos, método de pago y dirección de entrega.</li>
				<li>Datos técnicos: dirección IP, navegador, cookies y registros de actividad para seguridad y mejora del servicio.</li>
			</ul>
		`,
	},
	{
		name: 'V. Finalidad del tratamiento',
		content: `
			<p>Utilizamos tus datos para:</p>
			<ul>
				<li>Crear y administrar tu cuenta de usuario.</li>
				<li>Procesar compras, pagos y entregas.</li>
				<li>Enviar notificaciones sobre pedidos, facturación y soporte.</li>
				<li>Cumplir obligaciones legales y prevenir fraude.</li>
				<li>Mejorar la experiencia en la plataforma.</li>
			</ul>
		`,
	},
	{
		name: 'VI. Tus derechos',
		content: `
			<p>Conforme a la LOPDP puedes solicitar acceso, rectificación, eliminación, oposición u otros derechos sobre tus datos personales.</p>
			<p>Envía tu solicitud a <a href="mailto:${company.dataProtectionEmail}">${company.dataProtectionEmail}</a> indicando tu nombre completo y el detalle de tu requerimiento.</p>
		`,
	},
];

const termsAndConditions = [
	{
		name: 'Aceptación de los términos',
		content: `
			<p>Al acceder o utilizar ${company.tradeName} aceptas estos Términos y Condiciones. Si no estás de acuerdo, no debes usar la plataforma.</p>
			<p><strong>${company.legalName}</strong> (RUC ${company.ruc}) opera un marketplace que conecta compradores con empresas vendedoras. Cada empresa es responsable de sus productos, precios, inventario y cumplimiento de la venta.</p>
		`,
	},
	{
		name: 'Cuenta de usuario',
		content: `
			<ol>
				<li>Debes ser mayor de edad o contar con autorización de un representante legal para usar el servicio.</li>
				<li>Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad en tu cuenta.</li>
				<li>La información que proporciones debe ser veraz, completa y actualizada.</li>
				<li>${company.legalName} puede suspender o cancelar cuentas que incumplan estos términos o la ley.</li>
			</ol>
		`,
	},
	{
		name: 'Compras y pagos',
		content: `
			<p>Los precios mostrados pueden incluir o no impuestos según se indique en cada producto. Al confirmar un pedido autorizas el cobro del monto total indicado.</p>
			<p>Los pagos se procesan mediante proveedores externos seguros. ${company.legalName} no garantiza la disponibilidad permanente de un método de pago específico.</p>
		`,
	},
	{
		name: 'Entregas y devoluciones',
		content: `
			<p>Los tiempos de entrega dependen de la empresa vendedora, la ubicación y el método de envío seleccionado. Las políticas de cambio o devolución aplican según el producto y la normativa vigente.</p>
			<p>Para reclamos sobre un pedido, contacta primero a soporte indicando el número de orden.</p>
		`,
	},
	{
		name: 'Uso permitido',
		content: `
			<p>Queda prohibido:</p>
			<ul>
				<li>Usar la plataforma con fines ilícitos o fraudulentos.</li>
				<li>Intentar acceder sin autorización a sistemas, cuentas o datos de terceros.</li>
				<li>Publicar contenido falso, ofensivo o que infrinja derechos de propiedad intelectual.</li>
				<li>Automatizar consultas o extraer datos de forma masiva sin autorización.</li>
			</ul>
		`,
	},
	{
		name: 'Protección de datos personales',
		content: `
			<p>El tratamiento de tus datos personales se rige por la Política de Tratamiento de Datos Personales de ${company.legalName}, disponible en PDF en esta plataforma y durante el registro.</p>
			<p>Para ejercer tus derechos conforme a la LOPDP, escribe a <a href="mailto:${company.dataProtectionEmail}">${company.dataProtectionEmail}</a>.</p>
		`,
	},
	{
		name: 'Modificaciones y contacto',
		content: `
			<p>Podemos actualizar estos términos publicando la versión vigente en el sitio. El uso continuado del servicio implica la aceptación de los cambios.</p>
			<p><strong>Domicilio legal:</strong> ${company.legalAddress}</p>
			<p>Consultas: <a href="mailto:${company.supportEmail}">${company.supportEmail}</a></p>
		`,
	},
];

const faq = {
	sectionLead: 'Si no encuentras lo que buscas, contáctanos y con gusto te ayudamos.',
	faqs: [
		{
			ques: '¿Cómo creo una cuenta en All in One?',
			ans: 'Haz clic en Registrarse, completa el formulario y acepta los documentos legales requeridos (Política y Consentimiento de Tratamiento de Datos). Recibirás un correo de confirmación para activar tu cuenta.',
		},
		{
			ques: '¿Dónde puedo leer la política de datos personales?',
			ans: 'En la página de Política de privacidad y en los enlaces del formulario de registro. Los documentos oficiales en PDF están disponibles en /legal/v1/ del servidor de la API.',
		},
		{
			ques: '¿Qué métodos de pago aceptan?',
			ans: 'Aceptamos los métodos habilitados en el checkout, incluyendo opciones de pago en línea según disponibilidad en tu región. El detalle se muestra antes de confirmar el pedido.',
		},
		{
			ques: '¿Cómo puedo seguir el estado de mi pedido?',
			ans: 'Inicia sesión y ve a Mi cuenta → Historial de pedidos. Allí verás el estado actualizado de cada compra.',
		},
		{
			ques: '¿Cómo ejercer mis derechos sobre mis datos personales?',
			ans: `Puedes escribir a ${company.dataProtectionEmail} solicitando acceso, rectificación u otros derechos reconocidos por la LOPDP en Ecuador.`,
		},
		{
			ques: '¿No recibí el correo de confirmación?',
			ans: `Revisa la carpeta de spam. Si el problema persiste, contacta a ${company.supportEmail} con el correo registrado en tu cuenta.`,
		},
	],
};

module.exports = {
	company,
	contact,
	privacyPolicy,
	termsAndConditions,
	faq,
};
