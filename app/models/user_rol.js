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

const getUseRol = async () => {
    return await knex('user_rol as ur')
    .join('company_users as cu', 'cu.id_company_user', 'ur.id_company_user')
    .join('users as u', 'u.id_users', 'cu.id_users')
    .join('company as c', 'c.id_company', 'cu.id_company')
    .join('rol as r', 'r.id_rol', 'ur.id_rol')
    .select('ur.id_user_rol','u.name_user','c.id_company','u.id_users', 'c.name','r.description','r.name');
};

const getUseRolById = async (id_user_rol) => {
    return await knex('user_rol as ur')
    .join('company_users as cu', 'cu.id_company_user', 'ur.id_company_user')
    .join('users as u', 'u.id_users', 'cu.id_users')
    .join('company as c', 'c.id_company', 'cu.id_company')
    .join('rol as r', 'r.id_rol', 'ur.id_rol')
    .select('ur.id_user_rol','u.name_user','c.id_company','u.id_users', 'c.name','r.description','r.name')
    .where({ 'ur.id_user_rol':id_user_rol});
};

module.exports = {
    createUserRol,getUseRol,getUseRolById,
}