const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const forge = require('node-forge');

const REQUIRED_COMPANY_FIELDS = ['company_ruc', 'company_legal_name', 'company_address', 'company_email'];
const OPENSSL_BIN = process.env.OPENSSL_PATH || 'openssl';

const normalizeRuc = (value) => String(value || '').replace(/\D/g, '');

const normalizeText = (value) => String(value || '')
	.normalize('NFD')
	.replace(/[\u0300-\u036f]/g, '')
	.toLowerCase()
	.replace(/[^a-z0-9\s]/g, ' ')
	.replace(/\s+/g, ' ')
	.trim();

const getSubjectField = (cert, shortName) => {
	const field = cert.subject.getField(shortName);
	return field && field.value ? String(field.value).trim() : '';
};

const collectAllCertificateTexts = (cert) => {
	const values = [];

	if (cert.subject && Array.isArray(cert.subject.attributes)) {
		cert.subject.attributes.forEach((attribute) => {
			if (attribute && attribute.value != null) {
				values.push(String(attribute.value).trim());
			}
		});
	}

	if (cert.issuer && Array.isArray(cert.issuer.attributes)) {
		cert.issuer.attributes.forEach((attribute) => {
			if (attribute && attribute.value != null) {
				values.push(String(attribute.value).trim());
			}
		});
	}

	if (cert.serialNumber) {
		values.push(String(cert.serialNumber).trim());
	}

	if (Array.isArray(cert.extensions)) {
		cert.extensions.forEach((extension) => {
			if (!extension) return;

			if (Array.isArray(extension.altNames)) {
				extension.altNames.forEach((altName) => {
					if (altName && altName.value != null) {
						values.push(String(altName.value).trim());
					}
				});
			}

			if (extension.value != null && typeof extension.value !== 'object') {
				values.push(String(extension.value).trim());
			}
		});
	}

	return [...new Set(values.filter(Boolean))];
};

const findRucInTexts = (texts) => {
	for (const text of texts) {
		const explicitMatch = String(text).match(/ruc[\s:.\-_/]*(\d{13})/i);
		if (explicitMatch) return explicitMatch[1];
	}

	for (const text of texts) {
		const matches = String(text).match(/\d{13}/g) || [];
		for (const candidate of matches) {
			if (normalizeRuc(candidate).length === 13) {
				return candidate;
			}
		}
	}

	for (const text of texts) {
		const digits = normalizeRuc(text);
		if (digits.length === 13) return digits;
	}

	return '';
};

const findCedulaInTexts = (texts) => {
	for (const text of texts) {
		const explicitMatch = String(text).match(/(?:ci|cedula|c\.i\.?|identificacion)[\s:.\-_/]*(\d{10})/i);
		if (explicitMatch) return explicitMatch[1];
	}

	for (const text of texts) {
		const matches = String(text).match(/\b\d{10}\b/g) || [];
		if (matches.length) return matches[0];
	}

	return '';
};

const extractCertificateIdentifier = (cert) => {
	const texts = collectAllCertificateTexts(cert);
	const ruc = findRucInTexts(texts);

	if (ruc) {
		return { type: 'ruc', value: ruc };
	}

	const cedula = findCedulaInTexts(texts);
	if (cedula) {
		return { type: 'cedula', value: cedula };
	}

	return null;
};

const extractRucFromCertificate = (cert) => {
	const identifier = extractCertificateIdentifier(cert);
	return identifier && identifier.type === 'ruc' ? identifier.value : '';
};

const getPasswordCandidates = (password) => {
	const raw = password == null ? '' : String(password);
	const candidates = [];

	if (raw.length) candidates.push(raw);

	const trimmed = raw.trim();
	if (trimmed.length && trimmed !== raw) candidates.push(trimmed);

	return [...new Set(candidates)];
};

const readDerFromBuffer = (buffer) => {
	const derBuffer = forge.util.createBuffer(buffer.toString('binary'));
	return forge.asn1.fromDer(derBuffer.getBytes());
};

const extractCertificatesFromP12 = (p12) => {
	const allBags = p12.getBags();
	const certificates = [];

	Object.keys(allBags).forEach((bagType) => {
		(allBags[bagType] || []).forEach((bag) => {
			if (bag && bag.cert) {
				certificates.push(bag.cert);
			}
		});
	});

	return certificates;
};

const hasPrivateKeyInP12 = (p12) => {
	const keyBagTypes = [
		forge.pki.oids.pkcs8ShroudedKeyBag,
		forge.pki.oids.keyBag,
	];

	return keyBagTypes.some((bagType) => {
		const bags = p12.getBags({ bagType });
		return (bags[bagType] || []).some((bag) => !!bag.key);
	});
};

const selectSigningCertificate = (certificates) => {
	if (!certificates.length) return null;
	if (certificates.length === 1) return certificates[0];

	const entityCert = certificates.find((cert) => {
		const serialNumber = getSubjectField(cert, 'serialNumber');
		const cn = getSubjectField(cert, 'CN');
		const organization = getSubjectField(cert, 'O');
		const combined = [serialNumber, cn, organization].join(' ');
		return /\d{10,13}/.test(combined);
	});

	return entityCert || certificates[0];
};

const parsePkcs12WithForge = (buffer, password) => {
	const asn1 = readDerFromBuffer(buffer);
	const attempts = [
		{ strict: false },
		{ strict: true },
	];

	let lastError = null;

	for (const attempt of attempts) {
		try {
			const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, attempt.strict, password);
			const certificates = extractCertificatesFromP12(p12);
			const cert = selectSigningCertificate(certificates);

			if (!cert) {
				throw new Error('NO_CERTIFICATE');
			}

			if (!hasPrivateKeyInP12(p12)) {
				throw new Error('NO_PRIVATE_KEY');
			}

			return cert;
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError || new Error('PKCS12_PARSE_FAILED');
};

const extractCertificateWithOpenssl = (filePath, password) => new Promise((resolve, reject) => {
	const args = ['pkcs12', '-in', filePath, '-nodes', '-clcerts', '-passin', 'stdin'];
	const opensslProcess = spawn(OPENSSL_BIN, args, { stdio: ['pipe', 'pipe', 'pipe'] });

	let stdout = '';
	let stderr = '';

	opensslProcess.stdout.on('data', (chunk) => {
		stdout += chunk.toString();
	});

	opensslProcess.stderr.on('data', (chunk) => {
		stderr += chunk.toString();
	});

	opensslProcess.on('error', (error) => {
		if (error && error.code === 'ENOENT') {
			reject(new Error('OPENSSL_NOT_FOUND'));
			return;
		}
		reject(error);
	});

	opensslProcess.on('close', (code) => {
		if (code !== 0) {
			const output = `${stderr}\n${stdout}`.toLowerCase();
			if (output.includes('mac verify error') || output.includes('invalid password') || output.includes('password')) {
				reject(new Error('WRONG_PASSWORD'));
				return;
			}
			reject(new Error(`OPENSSL_FAILED:${stderr.trim() || stdout.trim()}`));
			return;
		}

		const certBlocks = stdout.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) || [];
		if (!certBlocks.length) {
			reject(new Error('NO_CERTIFICATE'));
			return;
		}

		try {
			const certificates = certBlocks.map((pem) => forge.pki.certificateFromPem(pem));
			const cert = selectSigningCertificate(certificates);
			if (!cert) {
				reject(new Error('NO_CERTIFICATE'));
				return;
			}
			resolve(cert);
		} catch (error) {
			reject(error);
		}
	});

	opensslProcess.stdin.write(`${password}\n`);
	opensslProcess.stdin.end();
});

const classifyPkcs12Error = (error) => {
	const message = String((error && error.message) || error || '').toLowerCase();

	if (
		message.includes('wrong_password')
		|| message.includes('mac verify error')
		|| message.includes('mac could not be validated')
		|| message.includes('invalid password')
		|| message.includes('unable to decrypt')
		|| message.includes('bad decrypt')
	) {
		return 'Contraseña incorrecta para el archivo de firma';
	}

	if (message.includes('no_certificate') || message.includes('no cert')) {
		return 'El archivo no contiene un certificado de firma válido';
	}

	if (message.includes('no_private_key')) {
		return 'El archivo no contiene una llave privada válida para firmar';
	}

	return 'No se pudo leer el archivo de firma. Verifica que sea un .p12/.pfx válido';
};

const readPkcs12Certificate = async (filePath, password) => {
	const buffer = fs.readFileSync(filePath);
	const passwordCandidates = getPasswordCandidates(password);

	if (!passwordCandidates.length) {
		throw new Error('La contraseña de la firma es requerida');
	}

	let lastError = null;

	for (const candidate of passwordCandidates) {
		try {
			return parsePkcs12WithForge(buffer, candidate);
		} catch (error) {
			lastError = error;
		}

		try {
			return await extractCertificateWithOpenssl(filePath, candidate);
		} catch (error) {
			if (error && (error.code === 'ENOENT' || error.message === 'OPENSSL_NOT_FOUND')) {
				break;
			}
			lastError = error;
		}
	}

	throw new Error(classifyPkcs12Error(lastError));
};

const readCertificateFile = async (filePath, password) => {
	const buffer = fs.readFileSync(filePath);
	const ext = String(filePath).toLowerCase().split('.').pop();

	if (ext === 'pem') {
		const pem = buffer.toString('utf8');
		return forge.pki.certificateFromPem(pem);
	}

	if (ext === 'p12' || ext === 'pfx') {
		return readPkcs12Certificate(filePath, password);
	}

	throw new Error('Formato de firma no soportado. Usa .p12, .pfx o .pem');
};

const namesMatch = (expectedName, cert) => {
	const expected = normalizeText(expectedName);
	if (!expected) return false;

	const subjectParts = [
		getSubjectField(cert, 'CN'),
		getSubjectField(cert, 'O'),
		getSubjectField(cert, 'OU'),
		getSubjectField(cert, 'serialNumber'),
	].map(normalizeText).filter(Boolean);

	return subjectParts.some((part) => part.includes(expected) || expected.includes(part));
};

const assertCertificateValidityPeriod = (cert) => {
	const now = new Date();
	const notBefore = cert.validity.notBefore;
	const notAfter = cert.validity.notAfter;

	if (now < notBefore) {
		throw new Error('El certificado aún no está vigente');
	}

	if (now > notAfter) {
		throw new Error(`El certificado está vencido desde ${notAfter.toISOString()}`);
	}
};

const inspectSignatureFile = async ({ filePath, password }) => {
	if (!filePath) {
		throw new Error('Archivo de firma requerido');
	}

	const resolvedPath = path.resolve(filePath);
	if (!fs.existsSync(resolvedPath)) {
		throw new Error(`El archivo de firma no existe: ${resolvedPath}`);
	}

	const cert = await readCertificateFile(resolvedPath, password);
	const identifier = extractCertificateIdentifier(cert);
	const now = new Date();

	return {
		filePath: resolvedPath,
		fileName: path.basename(resolvedPath),
		fileExists: true,
		subjectCn: getSubjectField(cert, 'CN'),
		subjectOrganization: getSubjectField(cert, 'O'),
		certificateIdType: identifier ? identifier.type : 'personal',
		certificateId: identifier ? identifier.value : null,
		validFrom: cert.validity.notBefore,
		validTo: cert.validity.notAfter,
		isExpired: now > cert.validity.notAfter,
		isNotYetValid: now < cert.validity.notBefore,
	};
};

const isCompanyProfileComplete = (settings) => {
	if (!settings) return false;

	const ruc = normalizeRuc(settings.company_ruc);
	if (ruc.length !== 13) return false;

	return REQUIRED_COMPANY_FIELDS.every((field) => {
		if (field === 'company_ruc') return true;
		const value = settings[field];
		return !!(value && String(value).trim());
	});
};

const assertCompanyProfileComplete = (settings) => {
	if (!isCompanyProfileComplete(settings)) {
		throw new Error('Primero guarda los datos del emisor (RUC, razón social, dirección y correo) antes de cargar la firma');
	}
};

const validateSignatureFile = async ({
	filePath,
	password,
	companyRuc,
	companyLegalName,
	companyTradeName,
}) => {
	if (!filePath) {
		throw new Error('Archivo de firma requerido');
	}

	const expectedRuc = normalizeRuc(companyRuc);
	if (expectedRuc.length !== 13) {
		throw new Error('El RUC del emisor debe tener 13 dígitos y estar guardado en la configuración');
	}

	const cert = await readCertificateFile(filePath, password);
	assertCertificateValidityPeriod(cert);

	const identifier = extractCertificateIdentifier(cert);
	let certificateRuc = null;
	let rucMatched = false;

	if (identifier && identifier.type === 'ruc') {
		certificateRuc = identifier.value;
		rucMatched = certificateRuc === expectedRuc;

		if (!rucMatched) {
			throw new Error(`El certificado pertenece al RUC ${certificateRuc} y no coincide con el emisor configurado (${expectedRuc})`);
		}
	}

	const legalNameMatched = namesMatch(companyLegalName, cert);
	const tradeNameMatched = namesMatch(companyTradeName, cert);

	return {
		valid: true,
		certificateRuc: certificateRuc || expectedRuc,
		certificateIdType: identifier ? identifier.type : 'personal',
		certificateId: identifier ? identifier.value : null,
		rucMatched,
		usesPersonalCertificate: !identifier || identifier.type === 'cedula',
		subjectCn: getSubjectField(cert, 'CN'),
		subjectOrganization: getSubjectField(cert, 'O'),
		companyNameMatched: legalNameMatched || tradeNameMatched,
		validFrom: cert.validity.notBefore,
		validTo: cert.validity.notAfter,
	};
};

module.exports = {
	isCompanyProfileComplete,
	assertCompanyProfileComplete,
	validateSignatureFile,
	inspectSignatureFile,
	normalizeRuc,
};
