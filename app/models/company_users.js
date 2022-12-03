const knex = require("../db/knex");
const constants = require("../constants/constants");

const deleteCompanyUsers= async({id_company_user}, trx) =>{

    await (trx || knex)('company_users')
    .where('id_company_user', '=', id_company_user)
    .update({ 
        status:constants.STATUS_INACTIVE,
        deleted_at:knex.fn.now()
     });
  
     return await getCompanyUserById(id_company_user);
  
  };

const getCompanyUserById = async (id_company_user) => {
   
    return await knex('company_users as p')
    .join('users as u', 'u.id_users', 'p.id_users')
    .join('company as c', 'c.id_company', 'p.id_company')
    .select('p.id_company_user','p.id_users','p.id_company','c.name', 'u.name_user')
    .where({ 'p.id_company_user':id_company_user});
};

const getCompanyUserByUserId = async (id_users, id_companny) => {
    return await knex('company_users as p')
    .join('users as u', 'u.id_users', 'p.id_users')
    .join('company as c', 'c.id_company', 'p.id_company')
    .select('c.name', 'u.name_user')
    .where({ 'p.id_users':id_users,
      'p.id_company': id_companny,
      'p.status':constants.STATUS_ACTIVE
    }).first();
};

const getCompanyUser = async () => {
    return await knex('company_users as p')
    .join('users as u', 'u.id_users', 'p.id_users')
    .join('company as c', 'c.id_company', 'p.id_company')
    .select('p.id_company_user','p.id_users','p.id_company','c.name', 'u.name_user');
};

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

const validateUserCompanyData = async ({
    body
  }) => {

    let validationObject ={};
    let errorMessage = "";

    

    if(!body.id_company){
      validationObject.name = "Es necesario enviar el numero de compañia a la quese se va asocial el usuario";
    }
    if(!body.id_users){
      validationObject.description = "Es necesario enviar el numero de usuario al que se va asociar el registro";
    }

    const ValidaRegistroCompanyUser = await getCompanyUserByUserId(body.id_users,body.id_company);

    if(ValidaRegistroCompanyUser){
      errorMessage = `El usuario : ${ValidaRegistroCompanyUser.name_user} ya se encuentra asociado a la empresa : ${ValidaRegistroCompanyUser.name}, por favor verificar` 
      validationObject.id_users="El usuario ya se encuentra asociada a la empresa";
    }

    return {
      validationObject,
      errorMessage
    };
    
};

module.exports = {
    getCompanyUserByUserId,
    createCompanyUser,
    validateUserCompanyData,
    getCompanyUser,
    deleteCompanyUsers
}