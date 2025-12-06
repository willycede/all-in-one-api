const knex = require('../db/knex');
const generalConstants = require('../constants/constants');

/**
 * Get all documents for a specific user and product
 */
const getDocumentsByUserAndProduct = async (userId, productId) => {
    return await knex.select()
        .from('product_user_documents')
        .where({
            user_id: userId,
            product_id: productId,
            status: generalConstants.STATUS_ACTIVE
        })
        .orderBy('created_at', 'desc');
};

/**
 * Get documents by user, product and document type
 */
const getDocumentByType = async (userId, productId, documentType) => {
    return await knex.select()
        .from('product_user_documents')
        .where({
            user_id: userId,
            product_id: productId,
            document_type: documentType,
            status: generalConstants.STATUS_ACTIVE
        })
        .first();
};

/**
 * Create a new document record
 */
const createDocument = async (documentData) => {
    const result = await knex('product_user_documents').insert({
        user_id: documentData.user_id,
        product_id: documentData.product_id,
        document_type: documentData.document_type,
        document_url: documentData.document_url,
        file_name: documentData.file_name,
        file_size: documentData.file_size || null,
        mime_type: documentData.mime_type || null,
        status: generalConstants.STATUS_ACTIVE,
        verified: false,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
    });

    return await knex('product_user_documents')
        .where({ id: result[0] })
        .first();
};

/**
 * Update document verification status
 */
const updateDocumentVerification = async (documentId, verifiedBy, verified, notes = null) => {
    await knex('product_user_documents')
        .where({ id: documentId })
        .update({
            verified: verified,
            verified_by: verifiedBy,
            verified_at: knex.fn.now(),
            notes: notes,
            updated_at: knex.fn.now()
        });

    return await knex('product_user_documents')
        .where({ id: documentId })
        .first();
};

/**
 * Delete a document (soft delete)
 */
const deleteDocument = async (documentId) => {
    return await knex('product_user_documents')
        .where({ id: documentId })
        .update({
            status: generalConstants.STATUS_INACTIVE,
            deleted_at: knex.fn.now()
        });
};

/**
 * Validate if user has uploaded all required documents for a product
 */
const validateRequiredDocuments = async (userId, productId, requiredDocumentsString) => {
    if (!requiredDocumentsString || requiredDocumentsString.trim() === '') {
        return {
            valid: true,
            missing: [],
            uploaded: []
        };
    }

    const requiredDocs = requiredDocumentsString
        .split(',')
        .map(doc => doc.trim())
        .filter(doc => doc !== '');

    const uploadedDocs = await getDocumentsByUserAndProduct(userId, productId);
    const uploadedTypes = uploadedDocs.map(doc => doc.document_type);

    const missingDocs = requiredDocs.filter(doc => !uploadedTypes.includes(doc));

    return {
        valid: missingDocs.length === 0,
        missing: missingDocs,
        uploaded: uploadedTypes,
        requiredCount: requiredDocs.length,
        uploadedCount: uploadedTypes.length
    };
};

/**
 * Get all documents for a user across all products
 */
const getAllDocumentsByUser = async (userId) => {
    return await knex.select('product_user_documents.*', 'products.name as product_name')
        .from('product_user_documents')
        .join('products', 'products.id_products', 'product_user_documents.product_id')
        .where({
            'product_user_documents.user_id': userId,
            'product_user_documents.status': generalConstants.STATUS_ACTIVE
        })
        .orderBy('product_user_documents.created_at', 'desc');
};

module.exports = {
    getDocumentsByUserAndProduct,
    getDocumentByType,
    createDocument,
    updateDocumentVerification,
    deleteDocument,
    validateRequiredDocuments,
    getAllDocumentsByUser
};
