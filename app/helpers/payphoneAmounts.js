/**
 * Payphone exige: amount = amountWithoutTax + amountWithTax + tax + service + tip
 * (todos en centavos, enteros).
 */
const toCents = (value) => Math.round(parseFloat(value || 0) * 100);

const normalizePayphoneAmounts = (amounts = {}) => {
	const amountWithoutTax = Math.round(Number(amounts.amountWithoutTax) || 0);
	const amountWithTax = Math.round(Number(amounts.amountWithTax) || 0);
	const tax = Math.round(Number(amounts.tax) || 0);
	const service = Math.round(Number(amounts.service) || 0);
	const tip = Math.round(Number(amounts.tip) || 0);
	const amount = amountWithoutTax + amountWithTax + tax + service + tip;

	return {
		amount,
		amountWithoutTax,
		amountWithTax,
		tax,
		service,
		tip,
	};
};

const buildPayphoneAmountsFromParts = ({ subtotal, couponDiscount = 0, tax, amountWithoutTax = 0, service = 0, tip = 0 }) => {
	const subtotalCents = toCents(subtotal);
	const couponCents = toCents(couponDiscount);
	const taxCents = toCents(tax);
	const amountWithTax = Math.max(0, subtotalCents - couponCents);

	return normalizePayphoneAmounts({
		amountWithoutTax,
		amountWithTax,
		tax: taxCents,
		service,
		tip,
	});
};

module.exports = {
	toCents,
	normalizePayphoneAmounts,
	buildPayphoneAmountsFromParts,
};
