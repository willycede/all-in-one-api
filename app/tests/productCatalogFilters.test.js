const assert = require('assert');
const {
	parseFilterParams,
	ALLOWED_SORT,
} = require('../helpers/productCatalogFilters');
const { parseRequiredDocuments } = require('../helpers/cartValidation');
const { calculateDiscountAmount } = require('../models/coupons');

let passed = 0;
let failed = 0;

const test = (name, fn) => {
	try {
		fn();
		passed += 1;
		console.log(`  ok ${name}`);
	} catch (error) {
		failed += 1;
		console.error(`  fail ${name}`);
		console.error(`       ${error.message}`);
	}
};

console.log('productCatalogFilters');
test('parseFilterParams defaults', () => {
	const result = parseFilterParams({});
	assert.strictEqual(result.minPrice, null);
	assert.strictEqual(result.maxPrice, null);
	assert.strictEqual(result.cityId, null);
	assert.strictEqual(result.sortBy, 'name_asc');
});

test('parseFilterParams parses price and city', () => {
	const result = parseFilterParams({ minPrice: '10.5', maxPrice: '99', cityId: '3', sortBy: 'price_desc' });
	assert.strictEqual(result.minPrice, 10.5);
	assert.strictEqual(result.maxPrice, 99);
	assert.strictEqual(result.cityId, 3);
	assert.strictEqual(result.sortBy, 'price_desc');
});

test('parseFilterParams rejects invalid sort', () => {
	const result = parseFilterParams({ sortBy: 'invalid' });
	assert.strictEqual(result.sortBy, 'name_asc');
	assert.ok(ALLOWED_SORT.includes('price_asc'));
});

console.log('cartValidation.parseRequiredDocuments');
test('parseRequiredDocuments comma separated', () => {
	const docs = parseRequiredDocuments('id_card, vote_certificate');
	assert.deepStrictEqual(docs, ['id_card', 'vote_certificate']);
});

test('parseRequiredDocuments json array', () => {
	const docs = parseRequiredDocuments('["id_card","work"]');
	assert.deepStrictEqual(docs, ['id_card', 'work']);
});

test('parseRequiredDocuments empty', () => {
	assert.deepStrictEqual(parseRequiredDocuments(''), []);
	assert.deepStrictEqual(parseRequiredDocuments(null), []);
});

console.log('coupons.calculateDiscountAmount');
test('percent discount', () => {
	const amount = calculateDiscountAmount({ discount_type: 'percent', discount_value: 10 }, 200);
	assert.strictEqual(amount, 20);
});

test('fixed discount capped by subtotal', () => {
	const amount = calculateDiscountAmount({ discount_type: 'fixed', discount_value: 50 }, 30);
	assert.strictEqual(amount, 30);
});

console.log('');
console.log(`${passed + failed} tests, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
