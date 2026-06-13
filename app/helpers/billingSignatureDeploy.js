const fs = require('fs');
const path = require('path');

const getDeployDirectory = () => {
	const configured = process.env.BILLING_SIGNATURE_DEPLOY_PATH;
	return configured ? path.resolve(configured) : null;
};

const deploySignatureForInvoicing = (localPath) => {
	const sourcePath = path.resolve(localPath);
	const deployDir = getDeployDirectory();

	if (!deployDir) {
		return {
			deployedPath: sourcePath,
			deployed: false,
			warning: 'BILLING_SIGNATURE_DEPLOY_PATH no está configurada. Se guardará la ruta local del API; WildFly debe poder leer ese archivo.',
		};
	}

	fs.mkdirSync(deployDir, { recursive: true });
	const deployedPath = path.join(deployDir, 'firma-electronica.p12');
	fs.copyFileSync(sourcePath, deployedPath);

	return {
		deployedPath,
		deployed: true,
		deployedTo: deployedPath,
	};
};

module.exports = {
	getDeployDirectory,
	deploySignatureForInvoicing,
};
