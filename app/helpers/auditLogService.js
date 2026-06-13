const auditLogModel = require('../models/auditLog');
const { getClientIp } = require('../controllers/legalDocumentController');

const logAuditEvent = async ({
	eventType,
	actorId = null,
	targetId = null,
	actorEmail = null,
	targetEmail = null,
	summary,
	metadata = null,
	req = null,
	ip = null,
	userAgent = null,
}) => {
	try {
		await auditLogModel.insertAuditLog({
			eventType,
			actorIdUsers: actorId,
			targetIdUsers: targetId,
			actorEmail,
			targetEmail,
			summary,
			metadata,
			ipAddress: ip || (req ? getClientIp(req) : null),
			userAgent: userAgent || (req && req.headers ? req.headers['user-agent'] : null),
		});
	} catch (error) {
		console.error('[audit-log]', eventType, error.message);
	}
};

module.exports = {
	logAuditEvent,
	listAuditLogs: auditLogModel.listAuditLogs,
	listEventTypes: auditLogModel.listEventTypes,
};
