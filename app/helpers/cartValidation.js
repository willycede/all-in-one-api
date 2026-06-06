const shoppingModel = require('../models/shopping');
const cartDetailDocumentsModel = require('../models/cartDetailDocuments');

const parseRequiredDocuments = (value) => {
	if (!value || (typeof value === 'string' && value.trim() === '')) {
		return [];
	}

	if (Array.isArray(value)) {
		return value.map((doc) => String(doc).trim()).filter(Boolean);
	}

	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (trimmed.startsWith('[')) {
			try {
				const parsed = JSON.parse(trimmed);
				if (Array.isArray(parsed)) {
					return parsed.map((doc) => String(doc).trim()).filter(Boolean);
				}
			} catch (error) {
				// fallback to comma split
			}
		}
		return trimmed.split(',').map((doc) => doc.trim()).filter(Boolean);
	}

	return [];
};

const validateShoppingCartDocuments = async (id_shopping_car) => {
	const cartDetails = await shoppingModel.getShopDetailsCarByIdShop(id_shopping_car);
	const validationResults = [];
	let allValid = true;

	for (const item of cartDetails) {
		const requiredDocs = parseRequiredDocuments(item.required_documents);

		if (requiredDocs.length === 0) {
			validationResults.push({
				id_details: item.id_details,
				id_product: item.id_product,
				product_name: item.name,
				valid: true,
				requires_documents: false,
			});
			continue;
		}

		const validation = await cartDetailDocumentsModel.validateRequiredDocuments(
			item.id_details,
			requiredDocs.join(',')
		);

		validationResults.push({
			id_details: item.id_details,
			id_product: item.id_product,
			product_name: item.name,
			valid: validation.valid,
			requires_documents: true,
			required_documents: requiredDocs,
			missing_documents: validation.missing,
			uploaded_documents: validation.uploaded,
		});

		if (!validation.valid) {
			allValid = false;
		}
	}

	return {
		valid: allValid,
		items: validationResults,
		total_items: cartDetails.length,
		items_with_missing_documents: validationResults.filter((item) => item.requires_documents && !item.valid).length,
	};
};

module.exports = {
	parseRequiredDocuments,
	validateShoppingCartDocuments,
};
