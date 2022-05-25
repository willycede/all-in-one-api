const knex = require("../db/knex");

const getCompanyUserByUserId = async (id_users, status) => {
    return await knex('company_users').where({
        id_users, status
    })
    .whereNot({
        id_company: null
    });
};
const createCompanyUser = async (id_company, id_users, status) => {

    console.log("AKIII");
    console.log(id_company);
    console.log(id_users);
    console.log(status);

    const result = await knex('company_users').insert(
        {
            id_company,
            id_users,
            status,
            created_at: knex.fn.now()/*,
            updated_at: knex.fn.now(),*/
        }
    )
    return await knex('company_users').where({
        id_company_user: result[0]
    })
};
module.exports = {
    getCompanyUserByUserId,
    createCompanyUser
}