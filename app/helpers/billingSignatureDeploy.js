const fs = require('fs');
const path = require('path');

const DEFAULT_SIGNATURE_DEPLOY_PATH = '/opt/wildfly/standalone/data/firma';
const DEPLOYED_SIGNATURE_FILE_NAME = 'firma-electronica.p12';

const resolveSignatureDeployDirectory = (configuredPath) => {
	const candidate = configuredPath
		|| process.env.BILLING_SIGNATURE_DEPLOY_PATH
		|| DEFAULT_SIGNATURE_DEPLOY_PATH;

	return path.resolve(String(candidate).trim());
};

const getDeployDirectory = (configuredPath) => resolveSignatureDeployDirectory(configuredPath);

const deploySignatureForInvoicing = (localPath, configuredDeployPath) => {
	const sourcePath = path.resolve(localPath);

	if (!fs.existsSync(sourcePath)) {
		throw new Error(`No se encontró el archivo de firma temporal: ${sourcePath}`);
	}

	const deployDir = resolveSignatureDeployDirectory(configuredDeployPath);

	try {
		fs.mkdirSync(deployDir, { recursive: true });
	} catch (error) {
		throw new Error(`No se pudo crear la carpeta de despliegue ${deployDir}: ${error.message}`);
	}

	const deployedPath = path.join(deployDir, DEPLOYED_SIGNATURE_FILE_NAME);

	try {
		fs.copyFileSync(sourcePath, deployedPath);
		fs.chmodSync(deployedPath, 0o640);
	} catch (error) {
		throw new Error(`No se pudo copiar la firma a ${deployedPath}: ${error.message}`);
	}

	if (!fs.existsSync(deployedPath)) {
		throw new Error(`La firma no quedó disponible en ${deployedPath}`);
	}

	return {
		deployedPath,
		deployed: true,
		deployDirectory: deployDir,
		deployedFileName: DEPLOYED_SIGNATURE_FILE_NAME,
	};
};

module.exports = {
	DEFAULT_SIGNATURE_DEPLOY_PATH,
	DEPLOYED_SIGNATURE_FILE_NAME,
	resolveSignatureDeployDirectory,
	getDeployDirectory,
	deploySignatureForInvoicing,
};
