const knex  = require("../db/knex");
const constants = require("../constants/constants");
const { validarEmail } = require("../utils/globalFunctions");
const bcrypt = require('bcryptjs');

const getUserByEmail = async ({email}) => {
    return await knex('users')
    .join('company_users', 'company_users.id_users', 'users.id_users')
    .join('user_rol', 'user_rol.id_company_user', 'company_users.id_company_user')
    .select(
      'users.id_users',
      'users.name_user',
      'users.last_name_user',
      'users.identification_number',
      'users.email',
      'users.password',
      'users.status',
      'users.recovery_pass',
      'users.access_token',
      'users.token_expires_in',
      'user_rol.id_rol',
      'user_rol.id_user_rol',
      'company_users.id_company_user'
    )  
    .where({ 'users.email':email,
      'users.status':constants.STATUS_ACTIVE,
      'user_rol.id_rol': 2,
      'company_users.id_company': null
    })
    .first();
  };

const getUserByCompanyAndEmail = async ({company_id, email}) => {
  return await knex('users')
    .join('company_users', 'company_users.id_users', 'users.id_users')
    .join('user_rol', 'user_rol.id_company_user', 'company_users.id_company_user')
    .select(
      'users.id_users',
      'users.name_user',
      'users.last_name_user',
      'users.identification_number',
      'users.email',
      'users.password',
      'users.status',
      'users.recovery_pass',
      'users.access_token',
      'users.token_expires_in',
      'user_rol.id_rol',
      'user_rol.id_user_rol',
      'company_users.id_company_user'
    )  
    .where({ 'users.email':email,
      'company_users.id_company': company_id,
      'users.status':constants.STATUS_ACTIVE,
      'user_rol.id_rol': 2
    })
    .first();
};

const getUserById = async ({id}) => {
  return await knex('users')
  .where({ id, status:constants.STATUS_ACTIVE })
};
const createUser = async ({user}) => {
    await knex('users').insert(user)
    return await knex('users').where({
      email:user.email
    })
  };

const updateUser = async ({ user }, trx) => {
  console.log("user model update")
  console.log(user)
    user.updated_at=knex.fn.now()
    await (trx || knex)('users')
    .where({ id: user.id })
    .update(user);
    return await getUserById({id:user.id});
}
const deleteUser= async({id}, trx) =>{
  await (trx || knex)('users')
  .where({ id: id })
  .update({ 
      status:constants.STATUS_INACTIVE,
      deleted_at:knex.fn.now()
   });
  return ;
}

const validateUserLoginData = async ({email, password, isAdmin, company_id}) => {
  let errorMessage = '';
  let validationObject = {};
    if(!email){
      validationObject.email = "El email es requerido y no puede estar vacio o ser nulo.";
    }
    if(!password){
      validationObject.password = "La contraseña es requerida y no puede estar vacia";
    }
    if(!validarEmail(email)){
      validationObject.email = "El email ingresado no posee un formato valido.";
    }
    let user;
    if(isAdmin) {
      user = await getUserByCompanyAndEmail({company_id ,email});
    }else {
      user = await getUserByEmail({email})
    }
    if(!user){
      errorMessage=`El usuario con el email ingresado no existe en nuestros registros`;
    }
    if(!bcrypt.compareSync(password, user.password)){
      errorMessage ="Email o contraseña incorrectos."
    }
  
    return {
      validationObject,
      errorMessage
    };
}
module.exports = { getUserByEmail, createUser,getUserByCompanyAndEmail,getUserById,updateUser,deleteUser, validateUserLoginData};