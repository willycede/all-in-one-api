const { getPreferencesByUser } = require('../models/userPreferences');

const normalizeLocale = (locale) => {
	const value = String(locale || '').toLowerCase();
	if (value === 'en' || value.startsWith('en-')) {
		return 'en';
	}
	return 'sp';
};

const getUserLocale = async (userId) => {
	if (!userId) {
		return 'sp';
	}
	const prefs = await getPreferencesByUser(userId);
	return normalizeLocale(prefs.locale);
};

const formatEmailDate = (locale) => {
	const tag = locale === 'en' ? 'en-US' : 'es-EC';
	return new Date().toLocaleString(tag, { timeZone: 'America/Guayaquil' });
};

module.exports = {
	normalizeLocale,
	getUserLocale,
	formatEmailDate,
};
