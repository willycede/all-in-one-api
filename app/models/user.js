const knex  = require("../db/knex");
const constants = require("../constants/constants")

const getUserByEmail = async ({email}) => {
    return await knex('users')
    .join('cities', 'cities.id', 'users.city_id')
    .select(
      'users.id',
      'users.city_id',
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
      'users.company_id',
      'users.status',
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
module.exports = { getUserByEmail, createUser,getUsersByCompany,getUserById,updateUser,deleteUser };