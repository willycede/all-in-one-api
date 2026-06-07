const response = require('../config/response');
const publicContent = require('../data/publicContent');

const getContact = (req, res) => {
	return response.success(req, res, publicContent.contact, 200);
};

const getPrivacyPolicy = (req, res) => {
	return response.success(req, res, {
		company: publicContent.company,
		sections: publicContent.privacyPolicy,
	}, 200);
};

const getTerms = (req, res) => {
	return response.success(req, res, publicContent.termsAndConditions, 200);
};

const getFaq = (req, res) => {
	return response.success(req, res, publicContent.faq, 200);
};

module.exports = {
	getContact,
	getPrivacyPolicy,
	getTerms,
	getFaq,
};
