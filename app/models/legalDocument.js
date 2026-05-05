const knex = require("../db/knex");

const getActiveDocuments = async () => {
    return await knex('legal_documents')
        .select('id', 'document_key', 'version', 'title', 'file_path', 'is_required', 'published_at')
        .where({ is_active: true })
        .orderBy('document_key');
};

const getDocumentByKeyAndVersion = async ({ document_key, version }) => {
    return await knex('legal_documents')
        .where({ document_key, version })
        .first();
};

const recordConsent = async ({ id_users, document_key, version, ip, user_agent }, trx) => {
    const builder = (trx || knex)('user_consents');
    return await builder.insert({
        id_users,
        document_key,
        version,
        ip,
        user_agent,
        accepted_at: knex.fn.now(),
    });
};

const getUserConsents = async ({ id_users }) => {
    return await knex('user_consents')
        .where({ id_users })
        .orderBy('accepted_at', 'desc');
};

module.exports = {
    getActiveDocuments,
    getDocumentByKeyAndVersion,
    recordConsent,
    getUserConsents,
};
