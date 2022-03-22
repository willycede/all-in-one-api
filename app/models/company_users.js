const knex = require("../db/knex");

const getCompanyUserByUserId = async (id_users, status) => {
    return await knex('company_users').where({
        id_users, status
    })
    .whereNot({
        id_company: null
    });
};

module.exports = {
    getCompanyUserByUserId,
}