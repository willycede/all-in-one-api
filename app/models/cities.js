const knex = require('../db/knex');

const getCitiesByIds = async (cityIds) => {
    return await knex.select()
        .from('city')
        .whereIn('id_city', cityIds)
        .orderBy('name', 'asc');
};

module.exports = {
    getCitiesByIds
};
