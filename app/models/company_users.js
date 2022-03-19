const knex = require("../db/knex");

const createCompanyUser = async (id_company, id_users, status) => {
    const result = await knex('company_users').insert(
        {
            id_company,
            id_users,
            status,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        }
    )
    return await knex('company_users').where({
        id_company_user: result[0]
    })
};

module.exports = {
    createCompanyUser,
}