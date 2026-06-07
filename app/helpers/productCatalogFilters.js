const ALLOWED_SORT = ['name_asc', 'name_desc', 'price_asc', 'price_desc'];

const parseFilterParams = (query) => {
	const minRaw = query.minPrice;
	const maxRaw = query.maxPrice;
	const minPrice = minRaw !== undefined && minRaw !== '' ? parseFloat(minRaw) : null;
	const maxPrice = maxRaw !== undefined && maxRaw !== '' ? parseFloat(maxRaw) : null;
	const cityId = query.cityId ? parseInt(query.cityId, 10) : null;
	const sortBy = ALLOWED_SORT.includes(query.sortBy) ? query.sortBy : 'name_asc';

	return {
		minPrice: Number.isFinite(minPrice) && minPrice >= 0 ? minPrice : null,
		maxPrice: Number.isFinite(maxPrice) && maxPrice >= 0 ? maxPrice : null,
		cityId: Number.isFinite(cityId) && cityId > 0 ? cityId : null,
		sortBy,
	};
};

const applyPriceFilters = (query, { minPrice, maxPrice }) => {
	if (minPrice !== null) {
		query.where('p.price', '>=', minPrice);
	}
	if (maxPrice !== null) {
		query.where('p.price', '<=', maxPrice);
	}
	return query;
};

const applyCityFilter = (query, cityId) => {
	if (!cityId) {
		return query;
	}

	const cityIdStr = String(cityId);
	return query.where(function cityScope() {
		this.whereNull('p.allowed_cities')
			.orWhere('p.allowed_cities', '')
			.orWhereRaw('FIND_IN_SET(?, REPLACE(p.allowed_cities, " ", "")) > 0', [cityIdStr]);
	});
};

const applySort = (query, sortBy) => {
	switch (sortBy) {
		case 'name_desc':
			return query.orderBy('p.name', 'desc');
		case 'price_asc':
			return query.orderBy('p.price', 'asc');
		case 'price_desc':
			return query.orderBy('p.price', 'desc');
		case 'name_asc':
		default:
			return query.orderBy('p.name', 'asc');
	}
};

module.exports = {
	ALLOWED_SORT,
	parseFilterParams,
	applyPriceFilters,
	applyCityFilter,
	applySort,
};
