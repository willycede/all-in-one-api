const knex = require('../db/knex');

const getCitiesByIds = async (cityIds) => {
    return await knex.select()
        .from('city')
        .whereIn('id_city', cityIds)
        .orderBy('name', 'asc');
};

const getAllCatalogCities = async () => {
    return await knex.select('id_city', 'name', 'state_id')
        .from('city')
        .orderBy('name', 'asc');
};

module.exports = {
    getCitiesByIds,
    getAllCatalogCities,
};
