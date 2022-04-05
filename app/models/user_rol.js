const knex = require("../db/knex");

const createUserRol = async (id_company_user, id_rol) => {
    const result = await knex('user_rol').insert(
        {
            id_rol,
            id_company_user,
        }
    )
    return await knex('user_rol').where({
        id_user_rol: result[0]
    })
};

module.exports = {
    createUserRol,
}