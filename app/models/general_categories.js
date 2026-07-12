//Import necessary libraries
const generalConstants = require('../constants/constants')
const knex = require('../db/knex')

const getGeneralCategories = async() => {
    return await knex.select()
    .from('general_categories')
    .where({status: generalConstants.STATUS_ACTIVE})
    .orderBy('name','asc')
}

const getGeneralCategoriesWithCategories = async() => {
    const generalCategories = await getGeneralCategories();
    const categories = await knex.select('id_category', 'id_general_category', 'name', 'description')
        .from('category')
        .where({status: generalConstants.STATUS_ACTIVE})
        .orderBy('name','asc');

    return generalCategories.map((generalCategory) => ({
        ...generalCategory,
        categories: categories.filter(
            (category) => category.id_general_category === generalCategory.idgeneral_categories
        ),
    }));
}

module.exports = {
    getGeneralCategories,
    getGeneralCategoriesWithCategories
};