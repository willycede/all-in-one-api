const knex = require('../db/knex');
const generalConstants = require('../constants/constants');

/**
 * Get all documents for a specific cart detail
 */
const getDocumentsByCartDetail = async (cartDetailId) => {
    return await knex.select()
        .from('cart_detail_documents')
        .where({
            cart_detail_id: cartDetailId,
            status: generalConstants.STATUS_ACTIVE
        })
        .orderBy('created_at', 'desc');
};

/**
 * Get documents by cart detail and document type
 */
const getDocumentByType = async (cartDetailId, documentType) => {
    return await knex.select()
        .from('cart_detail_documents')
        .where({
            cart_detail_id: cartDetailId,
            document_type: documentType,
            status: generalConstants.STATUS_ACTIVE
        })
        .first();
};

/**
 * Create a new document record
 */
const createDocument = async (documentData) => {
    const result = await knex('cart_detail_documents').insert({
        cart_detail_id: documentData.cart_detail_id,
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

    return await knex('cart_detail_documents')
        .where({ id: result[0] })
        .first();
};

/**
 * Update an existing document
 */
const updateDocument = async (documentId, documentData) => {
    await knex('cart_detail_documents')
        .where({ id: documentId })
        .update({
            document_url: documentData.document_url,
            file_name: documentData.file_name,
            file_size: documentData.file_size || null,
            mime_type: documentData.mime_type || null,
            updated_at: knex.fn.now()
        });

    return await knex('cart_detail_documents')
        .where({ id: documentId })
        .first();
};

/**
 * Update document verification status
 */
const updateDocumentVerification = async (documentId, verifiedBy, verified, notes = null) => {
    await knex('cart_detail_documents')
        .where({ id: documentId })
        .update({
            verified: verified,
            verified_by: verifiedBy,
            verified_at: knex.fn.now(),
            notes: notes,
            updated_at: knex.fn.now()
        });

    return await knex('cart_detail_documents')
        .where({ id: documentId })
        .first();
};

/**
 * Delete a document (soft delete)
 */
const deleteDocument = async (documentId) => {
    return await knex('cart_detail_documents')
        .where({ id: documentId })
        .update({
            status: generalConstants.STATUS_INACTIVE,
            deleted_at: knex.fn.now()
        });
};

/**
 * Validate if cart detail has uploaded all required documents for the product
 */
const validateRequiredDocuments = async (cartDetailId, requiredDocumentsString) => {
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

    const uploadedDocs = await getDocumentsByCartDetail(cartDetailId);
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
 * Get all documents for multiple cart details
 */
const getDocumentsByCartDetails = async (cartDetailIds) => {
    if (!cartDetailIds || cartDetailIds.length === 0) {
        return [];
    }

    return await knex.select()
        .from('cart_detail_documents')
        .whereIn('cart_detail_id', cartDetailIds)
        .where('status', generalConstants.STATUS_ACTIVE)
        .orderBy('cart_detail_id')
        .orderBy('created_at', 'desc');
};

module.exports = {
    getDocumentsByCartDetail,
    getDocumentByType,
    createDocument,
    updateDocument,
    updateDocumentVerification,
    deleteDocument,
    validateRequiredDocuments,
    getDocumentsByCartDetails
};
