const productModel = require('../models/products');
const productModifiersModel = require('../models/productModifiers');

const DEFAULT_IVA_RATE = 0.15;
const MAX_IVA_RATE = 0.5;

const round4 = (value) => Number(parseFloat(value).toFixed(4));

/*
 * El API no tiene una tasa de IVA propia: el cliente calcula details_iva a partir
 * de details_subtotal. Se reutiliza esa proporción declarada (acotada) para que la
 * línea recalculada quede consistente con el resto del carrito.
 */
const resolveIvaRate = (body) => {
	const subtotal = parseFloat(body.details_subtotal);
	const iva = parseFloat(body.details_iva);
	if (Number.isFinite(subtotal) && subtotal > 0 && Number.isFinite(iva) && iva >= 0) {
		const rate = iva / subtotal;
		if (rate >= 0 && rate <= MAX_IVA_RATE) {
			return rate;
		}
	}
	return DEFAULT_IVA_RATE;
};

/*
 * Normaliza los campos de modificador/ciudad del detalle del carrito. Si viene un
 * id_modifier, el precio unitario se recalcula desde la BD (products.price +
 * product_modifiers.price_delta) — el precio enviado por el cliente no se usa.
 */
const applyModifierPricing = async (body) => {
	const parsedCity = parseInt(body.id_city, 10);
	body.id_city = Number.isFinite(parsedCity) && parsedCity > 0 ? parsedCity : null;

	const idModifier = parseInt(body.id_modifier, 10);
	if (!Number.isFinite(idModifier) || idModifier <= 0) {
		body.id_modifier = null;
		body.modifier_name = null;
		body.modifier_price = 0;
		return body;
	}

	const modifier = await productModifiersModel.getActiveModifierForProduct(idModifier, body.id_product);
	if (!modifier) {
		throw new Error('El color seleccionado no está disponible para este producto');
	}

	const productRows = await productModel.getProductsByProductId(body.id_product);
	if (!productRows || productRows.length === 0) {
		throw new Error('El producto no se encuentra registrado');
	}

	const quantity = parseInt(body.details_quantity, 10);
	if (!Number.isFinite(quantity) || quantity <= 0) {
		throw new Error('La cantidad debe ser mayor a cero');
	}

	const ivaRate = resolveIvaRate(body);
	const basePrice = parseFloat(productRows[0].price) || 0;
	const priceDelta = parseFloat(modifier.price_delta) || 0;
	const unitPrice = round4(basePrice + priceDelta);
	const subtotal = round4(unitPrice * quantity);
	const iva = round4(subtotal * ivaRate);

	body.id_modifier = modifier.id_modifier;
	body.modifier_name = modifier.name;
	body.modifier_price = round4(priceDelta);
	body.details_price = unitPrice;
	body.details_subtotal = subtotal;
	body.details_iva = iva;
	body.details_total = round4(subtotal + iva);

	return body;
};

module.exports = {
	applyModifierPricing,
	resolveIvaRate,
	DEFAULT_IVA_RATE,
};
