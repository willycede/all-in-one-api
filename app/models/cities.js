const knex = require('../db/knex');
const generalConstants = require('../constants/constants');

const getCitiesByIds = async (cityIds) => {
    return await knex.select()
        .from('city')
        .whereIn('id_city', cityIds)
        .orderBy('name', 'asc');
};

const parseAllowedCityIds = (rows = []) => {
    const cityIds = new Set();
    rows.forEach((row) => {
        String(row.allowed_cities || '')
            .split(',')
            .map((value) => parseInt(value.trim(), 10))
            .filter((id) => Number.isFinite(id) && id > 0)
            .forEach((id) => cityIds.add(id));
    });
    return Array.from(cityIds);
};

// Solo se ofrecen las ciudades declaradas en allowed_cities de productos activos:
// la tabla city contiene el catálogo mundial y no es utilizable como filtro.
const getAllCatalogCities = async () => {
    const rows = await knex('products')
        .distinct('allowed_cities')
        .where('status', generalConstants.STATUS_ACTIVE)
        .whereNotNull('allowed_cities')
        .andWhere('allowed_cities', '<>', '');

    const cityIds = parseAllowedCityIds(rows);
    if (cityIds.length === 0) {
        return [];
    }

    return await knex.select('id_city', 'name', 'state_id')
        .from('city')
        .whereIn('id_city', cityIds)
        .orderBy('name', 'asc');
};

module.exports = {
    getCitiesByIds,
    getAllCatalogCities,
    parseAllowedCityIds,
};
