const productUserDocumentsModel = require('../models/productUserDocuments');
const productModel = require('../models/products');
const response = require('../config/response');
const path = require('path');

/**
 * Get all documents for a user and product
 */
const getDocumentsByUserAndProduct = async (req, res) => {
    try {
        const userId = parseInt(req.params.user_id);
        const productId = parseInt(req.params.product_id);

        if (!userId || !productId) {
            return response.error(req, res, { message: 'User ID and Product ID are required' }, 422);
        }

        const documents = await productUserDocumentsModel.getDocumentsByUserAndProduct(userId, productId);
        return response.success(req, res, documents, 200);
    } catch (error) {
        return response.error(req, res, { message: `getDocumentsByUserAndProduct: ${error.message}` }, 422);
    }
};

/**
 * Upload a new document with file (saves to server)
 */
const uploadDocumentWithFile = async (req, res) => {
    try {
        const { user_id, product_id, document_type } = req.body;

        let validationObject = {};

        if (!user_id) {
            validationObject.user_id = 'User ID is required';
        }
        if (!product_id) {
            validationObject.product_id = 'Product ID is required';
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

        // Verify product exists and get required documents
        const product = await productModel.getProductsByProductId(product_id);
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
        const existingDoc = await productUserDocumentsModel.getDocumentByType(user_id, product_id, document_type);
        if (existingDoc) {
            return response.error(req, res, { 
                message: `Document of type '${document_type}' already exists for this user and product`,
                existing_document: existingDoc
            }, 422);
        }

        // Build document URL (relative path from server root)
        const documentUrl = `/uploads/documents/${req.file.filename}`;

        const documentData = {
            user_id: parseInt(user_id),
            product_id: parseInt(product_id),
            document_type,
            document_url: documentUrl,
            file_name: req.file.originalname,
            file_size: req.file.size,
            mime_type: req.file.mimetype
        };

        const createdDocument = await productUserDocumentsModel.createDocument(documentData);
        return response.success(req, res, createdDocument, 201);
    } catch (error) {
        return response.error(req, res, { message: `uploadDocument: ${error.message}` }, 422);
    }
};

/**
 * Upload a new document (legacy - with external URL)
 */
const uploadDocument = async (req, res) => {
    try {
        const { user_id, product_id, document_type, document_url, file_name, file_size, mime_type } = req.body;

        let validationObject = {};
        let errorMessage = '';

        if (!user_id) {
            validationObject.user_id = 'User ID is required';
        }
        if (!product_id) {
            validationObject.product_id = 'Product ID is required';
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

        // Verify product exists and get required documents
        const product = await productModel.getProductsByProductId(product_id);
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
        const existingDoc = await productUserDocumentsModel.getDocumentByType(user_id, product_id, document_type);
        if (existingDoc) {
            return response.error(req, res, { 
                message: `Document of type '${document_type}' already exists for this user and product`,
                existing_document: existingDoc
            }, 422);
        }

        const documentData = {
            user_id,
            product_id,
            document_type,
            document_url,
            file_name,
            file_size,
            mime_type
        };

        const createdDocument = await productUserDocumentsModel.createDocument(documentData);
        return response.success(req, res, createdDocument, 201);
    } catch (error) {
        return response.error(req, res, { message: `uploadDocument: ${error.message}` }, 422);
    }
};

/**
 * Validate if user has all required documents for a product
 */
const validateDocuments = async (req, res) => {
    try {
        const userId = parseInt(req.params.user_id);
        const productId = parseInt(req.params.product_id);

        if (!userId || !productId) {
            return response.error(req, res, { message: 'User ID and Product ID are required' }, 422);
        }

        const product = await productModel.getProductsByProductId(productId);
        if (!product || product.length === 0) {
            return response.error(req, res, { message: 'Product not found' }, 404);
        }

        const validation = await productUserDocumentsModel.validateRequiredDocuments(
            userId, 
            productId, 
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

        await productUserDocumentsModel.deleteDocument(documentId);
        return response.success(req, res, { message: 'Document deleted successfully' }, 200);
    } catch (error) {
        return response.error(req, res, { message: `deleteDocument: ${error.message}` }, 422);
    }
};

/**
 * Get all documents for a user
 */
const getAllDocumentsByUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.user_id);

        if (!userId) {
            return response.error(req, res, { message: 'User ID is required' }, 422);
        }

        const documents = await productUserDocumentsModel.getAllDocumentsByUser(userId);
        return response.success(req, res, documents, 200);
    } catch (error) {
        return response.error(req, res, { message: `getAllDocumentsByUser: ${error.message}` }, 422);
    }
};

/**
 * Update document verification status
 */
const updateVerification = async (req, res) => {
    try {
        const documentId = parseInt(req.params.document_id);
        const { verified_by, verified, notes } = req.body;

        if (!documentId) {
            return response.error(req, res, { message: 'Document ID is required' }, 422);
        }

        if (verified_by === undefined || verified === undefined) {
            return response.error(req, res, { message: 'verified_by and verified fields are required' }, 422);
        }

        const updatedDocument = await productUserDocumentsModel.updateDocumentVerification(
            documentId,
            verified_by,
            verified,
            notes
        );

        return response.success(req, res, updatedDocument, 200);
    } catch (error) {
        return response.error(req, res, { message: `updateVerification: ${error.message}` }, 422);
    }
};

module.exports = {
    getDocumentsByUserAndProduct,
    uploadDocument,
    uploadDocumentWithFile,
    validateDocuments,
    deleteDocument,
    getAllDocumentsByUser,
    updateVerification
};
