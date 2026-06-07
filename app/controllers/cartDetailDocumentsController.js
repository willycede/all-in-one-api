const cartDetailDocumentsModel = require('../models/cartDetailDocuments');
const productModel = require('../models/products');
const response = require('../config/response');
const knex = require('../db/knex');

const assertCartDetailOwnership = async (req, res, cartDetailId) => {
    const tokenUserId = parseInt(req.userInfo && req.userInfo.id_users, 10);
    if (!tokenUserId) {
        response.error(req, res, { message: 'No autorizado' }, 403);
        return false;
    }

    const cartDetail = await knex('shopping_car_details as scd')
        .join('shopping_car as sc', 'sc.id_shopping_car', 'scd.id_shopping_car')
        .where('scd.id_details', cartDetailId)
        .select('sc.id_user')
        .first();

    if (!cartDetail) {
        response.error(req, res, { message: 'Cart detail not found' }, 404);
        return false;
    }

    if (parseInt(cartDetail.id_user, 10) !== tokenUserId) {
        response.error(req, res, { message: 'No tienes permiso para acceder a este carrito' }, 403);
        return false;
    }

    return true;
};

/**
 * Get all documents for a cart detail
 */
const getDocumentsByCartDetail = async (req, res) => {
    try {
        const cartDetailId = parseInt(req.params.cart_detail_id, 10);

        if (!cartDetailId) {
            return response.error(req, res, { message: 'Cart Detail ID is required' }, 422);
        }

        const hasAccess = await assertCartDetailOwnership(req, res, cartDetailId);
        if (!hasAccess) {
            return;
        }

        const documents = await cartDetailDocumentsModel.getDocumentsByCartDetail(cartDetailId);
        return response.success(req, res, documents, 200);
    } catch (error) {
        return response.error(req, res, { message: `getDocumentsByCartDetail: ${error.message}` }, 422);
    }
};

/**
 * Upload a new document with file (saves to server)
 */
const uploadDocumentWithFile = async (req, res) => {
    try {
        const { cart_detail_id, document_type } = req.body;

        let validationObject = {};

        if (!cart_detail_id) {
            validationObject.cart_detail_id = 'Cart Detail ID is required';
        }
        if (!document_type) {
            validationObject.document_type = 'Document type is required';
        }
        if (!req.file) {
            validationObject.file = 'File is required';
        }

        if (Object.keys(validationObject).length > 0) {
            return response.error(req, res, { message: 'Validation failed', validationObject }, 422);
        }

        const cartDetailId = parseInt(cart_detail_id, 10);
        const hasAccess = await assertCartDetailOwnership(req, res, cartDetailId);
        if (!hasAccess) {
            return;
        }

        // Get cart detail and product info
        const cartDetail = await knex('shopping_car_details')
            .where({ id_details: cartDetailId })
            .first();

        if (!cartDetail) {
            return response.error(req, res, { message: 'Cart detail not found' }, 404);
        }

        // Verify product exists and get required documents
        const product = await productModel.getProductsByProductId(cartDetail.id_product);
        if (!product || product.length === 0) {
            return response.error(req, res, { message: 'Product not found' }, 404);
        }

        // Verify document type is required for this product
        if (product[0].required_documents) {
            const requiredDocs = product[0].required_documents.split(',').map(doc => doc.trim());
            if (!requiredDocs.includes(document_type)) {
                return response.error(req, res, { 
                    message: `Document type '${document_type}' is not required for this product`,
                    required_documents: requiredDocs
                }, 422);
            }
        }

        // Build document URL (relative path from server root)
        const documentUrl = `/uploads/documents/${req.file.filename}`;

        const documentData = {
            cart_detail_id: cartDetailId,
            document_type,
            document_url: documentUrl,
            file_name: req.file.originalname,
            file_size: req.file.size,
            mime_type: req.file.mimetype
        };

        // Check if document already exists
        const existingDoc = await cartDetailDocumentsModel.getDocumentByType(cartDetailId, document_type);
        
        let savedDocument;
        if (existingDoc) {
            // Update existing document
            savedDocument = await cartDetailDocumentsModel.updateDocument(existingDoc.id, documentData);
        } else {
            // Create new document
            savedDocument = await cartDetailDocumentsModel.createDocument(documentData);
        }
        
        // Return format expected by frontend
        return response.success(req, res, {
            ...savedDocument,
            fileUrl: documentUrl,
            success: true
        }, existingDoc ? 200 : 201);
    } catch (error) {
        return response.error(req, res, { message: `uploadDocument: ${error.message}` }, 422);
    }
};

/**
 * Upload a new document (legacy - with external URL)
 */
const uploadDocument = async (req, res) => {
    try {
        const { cart_detail_id, document_type, document_url, file_name, file_size, mime_type } = req.body;

        let validationObject = {};

        if (!cart_detail_id) {
            validationObject.cart_detail_id = 'Cart Detail ID is required';
        }
        if (!document_type) {
            validationObject.document_type = 'Document type is required';
        }
        if (!document_url) {
            validationObject.document_url = 'Document URL is required';
        }
        if (!file_name) {
            validationObject.file_name = 'File name is required';
        }

        if (Object.keys(validationObject).length > 0) {
            return response.error(req, res, { message: 'Validation failed', validationObject }, 422);
        }

        const cartDetailId = parseInt(cart_detail_id, 10);
        const hasAccess = await assertCartDetailOwnership(req, res, cartDetailId);
        if (!hasAccess) {
            return;
        }

        // Get cart detail and product info
        const cartDetail = await knex('shopping_car_details')
            .where({ id_details: cartDetailId })
            .first();

        if (!cartDetail) {
            return response.error(req, res, { message: 'Cart detail not found' }, 404);
        }

        // Verify product exists and get required documents
        const product = await productModel.getProductsByProductId(cartDetail.id_product);
        if (!product || product.length === 0) {
            return response.error(req, res, { message: 'Product not found' }, 404);
        }

        // Verify document type is required for this product
        if (product[0].required_documents) {
            const requiredDocs = product[0].required_documents.split(',').map(doc => doc.trim());
            if (!requiredDocs.includes(document_type)) {
                return response.error(req, res, { 
                    message: `Document type '${document_type}' is not required for this product`,
                    required_documents: requiredDocs
                }, 422);
            }
        }

        // Check if document already exists
        const existingDoc = await cartDetailDocumentsModel.getDocumentByType(cartDetailId, document_type);
        if (existingDoc) {
            return response.error(req, res, { 
                message: `Document of type '${document_type}' already exists for this cart detail`,
                existing_document: existingDoc
            }, 422);
        }

        const documentData = {
            cart_detail_id,
            document_type,
            document_url,
            file_name,
            file_size,
            mime_type
        };

        const createdDocument = await cartDetailDocumentsModel.createDocument(documentData);
        return response.success(req, res, createdDocument, 201);
    } catch (error) {
        return response.error(req, res, { message: `uploadDocument: ${error.message}` }, 422);
    }
};

/**
 * Validate if cart detail has all required documents for the product
 */
const validateDocuments = async (req, res) => {
    try {
        const cartDetailId = parseInt(req.params.cart_detail_id, 10);

        if (!cartDetailId) {
            return response.error(req, res, { message: 'Cart Detail ID is required' }, 422);
        }

        const hasAccess = await assertCartDetailOwnership(req, res, cartDetailId);
        if (!hasAccess) {
            return;
        }

        // Get cart detail and product info
        const cartDetail = await knex('shopping_car_details')
            .where({ id_details: cartDetailId })
            .first();

        if (!cartDetail) {
            return response.error(req, res, { message: 'Cart detail not found' }, 404);
        }

        const product = await productModel.getProductsByProductId(cartDetail.id_product);
        if (!product || product.length === 0) {
            return response.error(req, res, { message: 'Product not found' }, 404);
        }

        const validation = await cartDetailDocumentsModel.validateRequiredDocuments(
            cartDetailId, 
            product[0].required_documents
        );

        return response.success(req, res, validation, 200);
    } catch (error) {
        return response.error(req, res, { message: `validateDocuments: ${error.message}` }, 422);
    }
};

/**
 * Delete a document
 */
const deleteDocument = async (req, res) => {
    try {
        const documentId = parseInt(req.params.document_id);

        if (!documentId) {
            return response.error(req, res, { message: 'Document ID is required' }, 422);
        }

        await cartDetailDocumentsModel.deleteDocument(documentId);
        return response.success(req, res, { message: 'Document deleted successfully' }, 200);
    } catch (error) {
        return response.error(req, res, { message: `deleteDocument: ${error.message}` }, 422);
    }
};

/**
 * Admin: list documents pending or verified review
 */
const getDocumentsForAdminReview = async (req, res) => {
    try {
        const statusFilter = req.query.status || 'pending';
        const allowedFilters = ['pending', 'verified', 'all'];
        const safeFilter = allowedFilters.includes(statusFilter) ? statusFilter : 'pending';

        const result = await cartDetailDocumentsModel.getDocumentsForAdminReview({
            page: req.query.page,
            limit: req.query.limit,
            statusFilter: safeFilter,
        });

        return response.success(req, res, result, 200);
    } catch (error) {
        return response.error(req, res, { message: `getDocumentsForAdminReview: ${error.message}` }, 422);
    }
};

/**
 * Update document verification status
 */
const updateVerification = async (req, res) => {
    try {
        const documentId = parseInt(req.params.document_id, 10);
        const { verified, notes } = req.body;
        const verifiedBy = parseInt(req.userInfo && req.userInfo.id_users, 10);

        if (!documentId) {
            return response.error(req, res, { message: 'Document ID is required' }, 422);
        }

        if (!verifiedBy) {
            return response.error(req, res, { message: 'Usuario administrador no identificado' }, 403);
        }

        if (verified === undefined) {
            return response.error(req, res, { message: 'verified field is required' }, 422);
        }

        const updatedDocument = await cartDetailDocumentsModel.updateDocumentVerification(
            documentId,
            verifiedBy,
            verified,
            notes
        );

        return response.success(req, res, updatedDocument, 200);
    } catch (error) {
        return response.error(req, res, { message: `updateVerification: ${error.message}` }, 422);
    }
};

module.exports = {
    getDocumentsByCartDetail,
    uploadDocument,
    uploadDocumentWithFile,
    validateDocuments,
    deleteDocument,
    updateVerification,
    getDocumentsForAdminReview,
};
