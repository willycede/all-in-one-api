const adminDashboardModel = require('../models/adminDashboard');
const response = require('../config/response');

const getDashboardStats = async (req, res) => {
	try {
		const stats = await adminDashboardModel.getDashboardStats();
		return response.success(req, res, stats, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

module.exports = {
	getDashboardStats,
};
