const isPayphoneDebugEnabled = () => String(process.env.PAYPHONE_DEBUG || '1') !== '0';

const logPayphone = (step, payload) => {
	if (!isPayphoneDebugEnabled()) {
		return;
	}

	const entry = {
		ts: new Date().toISOString(),
		step,
		...payload,
	};

	console.log(`[payphone] ${JSON.stringify(entry, null, 2)}`);
};

const readPayphoneEnv = () => ({
	PAYURLBTN: process.env.PAYURLBTN || null,
	PAYURLBTNCONFIRM: process.env.PAYURLBTNCONFIRM || null,
	PAYURL: process.env.PAYURL || null,
	PAYTOKENBTN: process.env.PAYTOKENBTN || null,
	PAYTOKEN: process.env.PAYTOKEN || null,
	PAYPHONE_STORE_ID: process.env.PAYPHONE_STORE_ID || process.env.PAYSTOREID || null,
	PAYPHONE_RESPONSE_URL: process.env.PAYPHONE_RESPONSE_URL || null,
	FRONTEND_URL: process.env.FRONTEND_URL || null,
});

const logPayphoneEnv = (step) => {
	const env = readPayphoneEnv();
	logPayphone(step, {
		env,
		notes: {
			usedForPrepareAndConfirm: 'PAYTOKENBTN',
			unusedInCurrentCode: ['PAYTOKEN', 'PAYURL'],
			storeIdConfigured: !!env.PAYPHONE_STORE_ID,
		},
	});
};

const logPayphoneAxiosError = (step, error) => {
	const responseData = error.response && error.response.data;
	logPayphone(step, {
		errorMessage: error.message,
		httpStatus: error.response && error.response.status,
		payphoneResponse: responseData,
		payphoneMessage: responseData && responseData.message,
	});
};

module.exports = {
	isPayphoneDebugEnabled,
	logPayphone,
	logPayphoneEnv,
	readPayphoneEnv,
	logPayphoneAxiosError,
};
