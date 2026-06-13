const auditLogService = require('../helpers/auditLogService');
const response = require('../config/response');

const listAuditLogs = async (req, res) => {
	try {
		const { page, limit, eventType, targetUserId, search } = req.query;
		const result = await auditLogService.listAuditLogs({
			page,
			limit,
			eventType,
			targetUserId,
			search,
		});
		return response.success(req, res, result, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

const listEventTypes = async (req, res) => {
	try {
		const eventTypes = await auditLogService.listEventTypes();
		return response.success(req, res, { eventTypes }, 200);
	} catch (error) {
		return response.error(req, res, { message: error.message }, 422);
	}
};

module.exports = {
	listAuditLogs,
	listEventTypes,
};
