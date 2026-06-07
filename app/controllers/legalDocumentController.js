const path = require('path');
const fs = require('fs');
const legalDocumentModel = require("../models/legalDocument");
const response = require("../config/response");

const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.toString().split(',')[0].trim();
    }
    return req.ip || (req.connection && req.connection.remoteAddress) || null;
};

const withPublicUrl = (document) => ({
    ...document,
    public_url: `/api/legal_documents/file/${document.document_key}`,
});

const listActive = async (req, res) => {
    try {
        const documents = await legalDocumentModel.getActiveDocuments();
        return response.success(req, res, documents.map(withPublicUrl), 200);
    } catch (error) {
        return response.error(req, res, { message: `listActiveError: ${error.message}` }, 422);
    }
};

const downloadFile = async (req, res) => {
    try {
        const { document_key } = req.params;
        if (!document_key) {
            return response.error(req, res, { message: 'El parámetro document_key es requerido' }, 422);
        }

        const document = await legalDocumentModel.getActiveDocumentByKey({ document_key });
        if (!document) {
            return response.error(req, res, { message: 'Documento no encontrado o inactivo' }, 404);
        }

        const relativePath = document.file_path.replace(/^\//, '');
        const absolutePath = path.join(__dirname, '../../', relativePath);

        if (!fs.existsSync(absolutePath)) {
            return response.error(req, res, { message: 'Archivo PDF no encontrado en el servidor' }, 404);
        }

        return res.sendFile(absolutePath);
    } catch (error) {
        return response.error(req, res, { message: `downloadFileError: ${error.message}` }, 422);
    }
};

const createConsent = async (req, res) => {
    try {
        const { id_users, document_key, version } = req.body;
        if (!id_users || !document_key || !version) {
            return response.error(
                req,
                res,
                { message: 'id_users, document_key y version son requeridos', validationObject: {} },
                422
            );
        }
        const document = await legalDocumentModel.getDocumentByKeyAndVersion({ document_key, version });
        if (!document) {
            return response.error(
                req,
                res,
                { message: `No existe el documento ${document_key} versión ${version}`, validationObject: {} },
                422
            );
        }
        await legalDocumentModel.recordConsent({
            id_users,
            document_key,
            version,
            ip: getClientIp(req),
            user_agent: req.headers['user-agent'] || null,
        });
        return response.success(req, res, { id_users, document_key, version }, 200);
    } catch (error) {
        return response.error(req, res, { message: `createConsentError: ${error.message}` }, 422);
    }
};

const getUserConsents = async (req, res) => {
    try {
        const id_users = req.params.id;
        if (!id_users) {
            return response.error(req, res, { message: 'El parámetro id es requerido' }, 422);
        }
        const consents = await legalDocumentModel.getUserConsents({ id_users });
        return response.success(req, res, consents, 200);
    } catch (error) {
        return response.error(req, res, { message: `getUserConsentsError: ${error.message}` }, 422);
    }
};

module.exports = {
    listActive,
    downloadFile,
    createConsent,
    getUserConsents,
    getClientIp,
};
