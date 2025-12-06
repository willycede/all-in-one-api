const productModel = require('../models/products');
const productUserDocumentsModel = require('../models/productUserDocuments');

/**
 * Validate cart items to ensure all required documents are uploaded
 * @param {number} userId - The user ID
 * @param {Array} cartItems - Array of cart items with product_id
 * @returns {Object} Validation result with details
 */
const validateCartDocuments = async (userId, cartItems) => {
    try {
        const validationResults = [];
        let allValid = true;

        for (const item of cartItems) {
            const productId = item.product_id || item.id_products;
            
            if (!productId) {
                continue;
            }

            // Get product details
            const product = await productModel.getProductsByProductId(productId);
            
            if (!product || product.length === 0) {
                validationResults.push({
                    product_id: productId,
                    valid: false,
                    error: 'Product not found'
                });
                allValid = false;
                continue;
            }

            const productData = product[0];

            // Check if product requires documents
            if (!productData.required_documents || productData.required_documents.trim() === '') {
                validationResults.push({
                    product_id: productId,
                    product_name: productData.name,
                    valid: true,
                    requires_documents: false
                });
                continue;
            }

            // Validate documents
            const validation = await productUserDocumentsModel.validateRequiredDocuments(
                userId,
                productId,
                productData.required_documents
            );

            validationResults.push({
                product_id: productId,
                product_name: productData.name,
                valid: validation.valid,
                requires_documents: true,
                required_documents: productData.required_documents.split(',').map(doc => doc.trim()),
                required_count: validation.requiredCount,
                uploaded_count: validation.uploadedCount,
                missing_documents: validation.missing,
                uploaded_documents: validation.uploaded
            });

            if (!validation.valid) {
                allValid = false;
            }
        }

        return {
            valid: allValid,
            items: validationResults,
            total_items: cartItems.length,
            items_requiring_documents: validationResults.filter(r => r.requires_documents).length,
            items_with_missing_documents: validationResults.filter(r => !r.valid).length
        };
    } catch (error) {
        throw new Error(`validateCartDocuments: ${error.message}`);
    }
};

/**
 * Validate a single product for cart addition
 * @param {number} userId - The user ID
 * @param {number} productId - The product ID
 * @returns {Object} Validation result
 */
const validateProductForCart = async (userId, productId) => {
    try {
        // Get product details
        const product = await productModel.getProductsByProductId(productId);
        
        if (!product || product.length === 0) {
            return {
                valid: false,
                error: 'Product not found'
            };
        }

        const productData = product[0];

        // Check if product requires documents
        if (!productData.required_documents || productData.required_documents.trim() === '') {
            return {
                valid: true,
                requires_documents: false,
                product_name: productData.name
            };
        }

        // Validate documents
        const validation = await productUserDocumentsModel.validateRequiredDocuments(
            userId,
            productId,
            productData.required_documents
        );

        return {
            valid: validation.valid,
            requires_documents: true,
            product_name: productData.name,
            required_documents: productData.required_documents.split(',').map(doc => doc.trim()),
            required_count: validation.requiredCount,
            uploaded_count: validation.uploadedCount,
            missing_documents: validation.missing,
            uploaded_documents: validation.uploaded
        };
    } catch (error) {
        throw new Error(`validateProductForCart: ${error.message}`);
    }
};

/**
 * Get summary of document requirements for a product
 * @param {number} productId - The product ID
 * @returns {Object} Document requirements summary
 */
const getProductDocumentRequirements = async (productId) => {
    try {
        const product = await productModel.getProductsByProductId(productId);
        
        if (!product || product.length === 0) {
            return {
                error: 'Product not found'
            };
        }

        const productData = product[0];

        if (!productData.required_documents || productData.required_documents.trim() === '') {
            return {
                product_id: productId,
                product_name: productData.name,
                requires_documents: false,
                required_documents: []
            };
        }

        const requiredDocs = productData.required_documents
            .split(',')
            .map(doc => doc.trim())
            .filter(doc => doc !== '');

        return {
            product_id: productId,
            product_name: productData.name,
            requires_documents: true,
            required_documents: requiredDocs,
            required_count: requiredDocs.length
        };
    } catch (error) {
        throw new Error(`getProductDocumentRequirements: ${error.message}`);
    }
};

module.exports = {
    validateCartDocuments,
    validateProductForCart,
    getProductDocumentRequirements
};
