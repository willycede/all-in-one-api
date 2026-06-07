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
            verified: false,
            verified_by: null,
            verified_at: null,
            notes: null,
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

const DEFAULT_ADMIN_LIMIT = 20;
const ADMIN_LIMITS = [20, 50, 100];

const normalizeAdminPagination = (page, limit) => {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = parseInt(limit, 10);
    const safeLimit = ADMIN_LIMITS.includes(parsedLimit) ? parsedLimit : DEFAULT_ADMIN_LIMIT;
    return { page: safePage, limit: safeLimit };
};

const buildAdminDocumentsQuery = (statusFilter) => {
    let query = knex('cart_detail_documents as cdd')
        .join('shopping_car_details as scd', 'scd.id_details', 'cdd.cart_detail_id')
        .join('products as p', 'p.id_products', 'scd.id_product')
        .join('shopping_car as sc', 'sc.id_shopping_car', 'scd.id_shopping_car')
        .join('users as u', 'u.id_users', 'sc.id_user')
        .where('cdd.status', generalConstants.STATUS_ACTIVE)
        .where('scd.status', generalConstants.STATUS_ACTIVE)
        .whereNot('sc.status', 4);

    if (statusFilter === 'pending') {
        query = query.where('cdd.verified', false);
    } else if (statusFilter === 'verified') {
        query = query.where('cdd.verified', true);
    }

    return query;
};

const getDocumentsForAdminReview = async ({ page, limit, statusFilter }) => {
    const { page: safePage, limit: safeLimit } = normalizeAdminPagination(page, limit);
    const offset = (safePage - 1) * safeLimit;
    const baseQuery = buildAdminDocumentsQuery(statusFilter);

    const countResult = await baseQuery
        .clone()
        .count({ total: 'cdd.id' })
        .first();

    const total = Number((countResult && countResult.total) || 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

    const items = await baseQuery
        .clone()
        .select(
            'cdd.id',
            'cdd.cart_detail_id',
            'cdd.document_type',
            'cdd.document_url',
            'cdd.file_name',
            'cdd.file_size',
            'cdd.mime_type',
            'cdd.verified',
            'cdd.verified_by',
            'cdd.verified_at',
            'cdd.notes',
            'cdd.created_at',
            'p.id_products',
            'p.name as product_name',
            'p.cod_products',
            'sc.id_shopping_car',
            'sc.status as order_status',
            'u.id_users',
            'u.name_user',
            'u.last_name_user',
            'u.email'
        )
        .orderBy('cdd.created_at', 'desc')
        .limit(safeLimit)
        .offset(offset);

    return {
        items,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages,
            hasNextPage: safePage < totalPages,
            hasPrevPage: safePage > 1,
        },
    };
};

module.exports = {
    getDocumentsByCartDetail,
    getDocumentByType,
    createDocument,
    updateDocument,
    updateDocumentVerification,
    deleteDocument,
    validateRequiredDocuments,
    getDocumentsByCartDetails,
    getDocumentsForAdminReview,
};
