const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DEFAULT_SIGNATURE_DEPLOY_PATH = '/opt/wildfly/standalone/data/firma';
const DEPLOYED_SIGNATURE_FILE_NAME = 'firma-electronica.p12';
const DEFAULT_SIGNATURE_DEPLOY_OWNER = 'wildfly:wildfly';

const resolveSignatureDeployDirectory = (configuredPath) => {
	const candidate = configuredPath
		|| process.env.BILLING_SIGNATURE_DEPLOY_PATH
		|| DEFAULT_SIGNATURE_DEPLOY_PATH;

	return path.resolve(String(candidate).trim());
};

const getDeployDirectory = (configuredPath) => resolveSignatureDeployDirectory(configuredPath);

const applyDeployPermissions = (deployDir, deployedPath) => {
	fs.chmodSync(deployDir, 0o755);
	fs.chmodSync(deployedPath, 0o644);

	if (process.platform === 'win32') {
		return { ownerApplied: false, reason: 'windows' };
	}

	const owner = process.env.BILLING_SIGNATURE_DEPLOY_OWNER || DEFAULT_SIGNATURE_DEPLOY_OWNER;

	try {
		execFileSync('chown', [owner, deployDir], { stdio: 'pipe' });
		execFileSync('chown', [owner, deployedPath], { stdio: 'pipe' });
		return { ownerApplied: true, owner };
	} catch (error) {
		console.warn('[billing-signature] No se pudo aplicar chown a la firma:', error.message);
		return { ownerApplied: false, owner, warning: error.message };
	}
};

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
	} catch (error) {
		throw new Error(`No se pudo copiar la firma a ${deployedPath}: ${error.message}`);
	}

	if (!fs.existsSync(deployedPath)) {
		throw new Error(`La firma no quedó disponible en ${deployedPath}`);
	}

	const permissions = applyDeployPermissions(deployDir, deployedPath);

	return {
		deployedPath,
		deployed: true,
		deployDirectory: deployDir,
		deployedFileName: DEPLOYED_SIGNATURE_FILE_NAME,
		permissions,
	};
};

module.exports = {
	DEFAULT_SIGNATURE_DEPLOY_PATH,
	DEFAULT_SIGNATURE_DEPLOY_OWNER,
	DEPLOYED_SIGNATURE_FILE_NAME,
	resolveSignatureDeployDirectory,
	getDeployDirectory,
	deploySignatureForInvoicing,
};
