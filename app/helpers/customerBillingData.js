const knex = require('../db/knex');
const { validarEmail } = require('../utils/globalFunctions');

const BILLING_FIELD_LABELS = {
	type_id: 'tipo de identificación',
	id_document: 'cédula o RUC',
	razon_social: 'nombres o razón social',
	razon_comercial: 'apellidos o nombre comercial',
	address: 'dirección',
	mail: 'correo electrónico',
};

const deriveTypeId = (idDocument) => {
	const doc = String(idDocument || '').trim();
	if (doc.length === 13) return 'R';
	if (doc.length === 10) return 'C';
	return 'P';
};

const buildInvoiceDataFromUser = (user) => {
	const idDocument = String(user.identification_number || '').trim();
	const typeId = deriveTypeId(idDocument);

	return {
		id_user: user.id_users,
		type_id: typeId,
		id_document: idDocument,
		razon_social: String(user.name_user || '').trim(),
		razon_comercial: String(user.last_name_user || '').trim(),
		address: String(user.address || '').trim(),
		mail: String(user.email || '').trim(),
		principal: 1,
	};
};

const getBillingValidationIssues = (data) => {
	const issues = [];
	if (!data) {
		return Object.values(BILLING_FIELD_LABELS);
	}

	const typeId = String(data.type_id || '').trim().toUpperCase();
	const idDocument = String(data.id_document || '').trim();
	const razonSocial = String(data.razon_social || '').trim();
	const razonComercial = String(data.razon_comercial || '').trim();
	const address = String(data.address || '').trim();
	const mail = String(data.mail || '').trim();

	if (!['C', 'R', 'P'].includes(typeId)) {
		issues.push(BILLING_FIELD_LABELS.type_id);
	}

	if (typeId === 'C' && idDocument.length !== 10) {
		issues.push(BILLING_FIELD_LABELS.id_document);
	} else if (typeId === 'R' && idDocument.length !== 13) {
		issues.push(BILLING_FIELD_LABELS.id_document);
	} else if (!idDocument) {
		issues.push(BILLING_FIELD_LABELS.id_document);
	}

	if (!razonSocial) {
		issues.push(BILLING_FIELD_LABELS.razon_social);
	}

	if ((typeId === 'C' || typeId === 'R') && !razonComercial) {
		issues.push(BILLING_FIELD_LABELS.razon_comercial);
	}

	if (!address) {
		issues.push(BILLING_FIELD_LABELS.address);
	}

	if (!mail || !validarEmail(mail)) {
		issues.push(BILLING_FIELD_LABELS.mail);
	}

	return issues;
};

const getUserById = async (idUser) => (
	knex('users')
		.select(
			'id_users',
			'name_user',
			'last_name_user',
			'identification_number',
			'address',
			'email',
		)
		.where({ id_users: idUser })
		.first()
);

const getCustomerBillingData = async (idUser) => {
	const invoiceRow = await knex('invoice_data')
		.where({ id_user: idUser, principal: 1 })
		.first();

	if (invoiceRow) {
		return invoiceRow;
	}

	const user = await getUserById(idUser);
	if (!user) {
		return null;
	}

	const derived = buildInvoiceDataFromUser(user);
	if (getBillingValidationIssues(derived).length === 0) {
		await upsertInvoiceDataFromUser(idUser);
		const syncedRow = await knex('invoice_data')
			.where({ id_user: idUser, principal: 1 })
			.first();
		return syncedRow || derived;
	}

	return derived;
};

const upsertInvoiceDataFromUser = async (idUser) => {
	const user = await getUserById(idUser);
	if (!user) {
		return null;
	}

	const payload = buildInvoiceDataFromUser(user);
	const existing = await knex('invoice_data')
		.where({ id_user: idUser, principal: 1 })
		.first();

	if (existing) {
		await knex('invoice_data')
			.where({ id_invoice_data: existing.id_invoice_data })
			.update({
				type_id: payload.type_id,
				id_document: payload.id_document,
				razon_social: payload.razon_social,
				razon_comercial: payload.razon_comercial,
				address: payload.address,
				mail: payload.mail,
				updated_at: knex.fn.now(),
			});
		return { ...existing, ...payload };
	}

	const [idInvoiceData] = await knex('invoice_data').insert({
		...payload,
		principal: true,
	});

	return { id_invoice_data: idInvoiceData, ...payload };
};

const getCustomerBillingStatus = async (idUser) => {
	const data = await getCustomerBillingData(idUser);
	const missing = getBillingValidationIssues(data);

	return {
		ready: missing.length === 0,
		missing,
		data,
	};
};

const assertCustomerBillingReady = async (idUser) => {
	const status = await getCustomerBillingStatus(idUser);
	if (status.ready) {
		return status.data;
	}

	const err = new Error(
		`Completa tus datos de facturación en tu perfil antes de confirmar el pedido. Faltan: ${status.missing.join(', ')}.`
	);
	err.step = 'billing_profile';
	err.statusCode = 422;
	err.validation = {
		ready: false,
		missing: status.missing,
	};
	throw err;
};

module.exports = {
	BILLING_FIELD_LABELS,
	deriveTypeId,
	buildInvoiceDataFromUser,
	getBillingValidationIssues,
	getCustomerBillingData,
	upsertInvoiceDataFromUser,
	getCustomerBillingStatus,
	assertCustomerBillingReady,
};
