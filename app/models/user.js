const knex  = require("../db/knex");
const constants = require("../constants/constants")

const getUserByEmail = async ({email}) => {
    return await knex('users')
    .select(
      'users.id_users',
      'users.name_user',
      'users.last_name_user',
      'users.identification_number',
      'users.email',
      'users.password',
      'users.email',
      'users.password',
      'users.status',
      'users.recovery_pass',
      'users.access_token',
      'users.token_expires_in',
    )  
    .where({ 'users.email':email, 'users.status':constants.STATUS_ACTIVE })
    .first();
  };

const getUsersByCompany = async ({company_id}) => {
  return await knex('users')
  .join('cities', 'cities.id', 'users.city_id')
  .select(
      'users.id',
      'users.company_id',
      'users.first_name',
      'users.second_name',
      'users.first_last_name',
      'users.second_last_name',
      'users.email',
      'users.password',
      'users.access_token',
      'users.cellphone_number',
      'users.address',
      'users.identification_number',
      'users.status',
      'users.token_expires_in',
      'users.city_id',
      'users.status',
  )  
  .where({ 'users.company_id' : company_id,  'users.status':constants.STATUS_ACTIVE })
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

const validateUserLoginData = async ({email, password, isAdmin}) => {
  let errorMessage = '';
  let validationObject = {};
    if(!email){
      validationObject.email = "El email es requerido y no puede estar vacio o ser nulo.";
    }
    if(!password){
      validationObject.password = "La contraseña es requerida y no puede estar vacia";
    }
    if(!utils.validarEmail(email)){
      validationObject.email = "El email ingresado no posee un formato valido.";
    }
    //Se procede a traer el usuario basado en el email, para luego comparar sus contraseñas
    const user = await getUserByEmail({email});
    if(!user){
      errorMessage=`El usuario con el email ingresado no existe en nuestros registros`;
    }
    if(!bcrypt.compareSync(password, user.password)){
      errorMessage ="Email o contraseña incorrectos."
    }
    if(isAdmin) {
      const existsUserInAdminTable = await getCompanyUserByUserId({id_users: user.id_users});
      if(!existsUserInAdminTable){
        errorMessage=`El usuario no posee una cuenta asociada a alguna empresa.`;
      }
    }
    return {
      validationObject,
      errorMessage
    };
}
module.exports = { getUserByEmail, createUser,getUsersByCompany,getUserById,updateUser,deleteUser, validateUserLoginData};