const knex  = require("../db/knex");
const constants = require("../constants/constants");
const { validarEmail, validarRucCedula } = require("../utils/globalFunctions");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const moment = require('moment');
const { createCompanyUser } = require("./company_users");
const { createUserRol } = require("./user_rol");

const getUserByEmailRolClient= async ({email}) => {
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
    'user_rol.id_rol': constants.CLIENT_ROL,
    'company_users.id_company': null
  })
  .first();
};
const getUserByEmail = async ({email}) => {
  return await knex('users')
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
      'user_rol.id_rol': 1
    })
    .first();
};

const getUserById = async ({id_users}) => {
  return await knex('users')
  .where({ id_users, status:constants.STATUS_ACTIVE })
};
const createUser = async ({user}) => {
    await knex('users').insert(user)
    return await knex('users').where({
      email:user.email
    })
  };

const updateUserSessionData = async ({ user }, trx) => {
  await (trx || knex)('users')
  .where({ id_users: user.id_users })
  .update({
    access_token: user.access_token,
    token_expires_in: user.token_expires_in,
    updated_at: knex.fn.now(),
  });
  return await getUserById({id_users:user.id_users});
}
const updateUser = async ({ user }, trx) => {
    user.updated_at=knex.fn.now()
    await (trx || knex)('users')
    .where({ id_users: user.id_users })
    .update(user);
    return await getUserById({id_users: user.id_users});
}
const deleteUser= async({id_users}, trx) =>{
  await (trx || knex)('users')
  .where({ id_users })
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
      if(!company_id) {
        validationObject.company_id = "El id de compañoa es requerido y no puede estar vacio o ser nulo.";
      }
      user = await getUserByCompanyAndEmail({company_id ,email});
    }else {
      user = await getUserByEmailRolClient({email})
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
const validateUserData = async ({
  body,
  isAdmin,
}) => {
  let validationObject ={};
  let errorMessage = "";
  if(!body.name_user){
    validationObject.first_name = "El nombre es requerido y no puede ser vacio o nulo";
  }
  if(!body.last_name_user){
    validationObject.second_name = "El apellido es requerido y no puede ser vacio o nulo";
  }
  if(!body.identification_number){
    validationObject.identification_number = "El número de cedula es requerido y no puede ser vacio o nulo";
  }
  if(!body.email){
    validationObject.email = "El email es requerido y no puede ser vacio o nulo";
  }
  if(!body.password){
    validationObject.password = "La contraseña es requerida y no puede ser vacia o nula";
  }
  if(isAdmin && !body.company_id){
    validationObject.company_id = "El id de la compañia es requerido cuando el usuario que se esta registrando es de tipo administrador";
  }
  
  let valiteIdentification= validarRucCedula(body.identification_number)
  if(valiteIdentification.status==0){
      validationObject.identification_number=valiteIdentification.message;
  }
  const userDb = await getUserByEmail({email:body.email})
  if(userDb){
      errorMessage= `El usuario con email ${body.email} ya existe en nuestros registros`;
  }
  return {
    validationObject,
    errorMessage
  };
}

const createUserLogic = async (
  {
    body,
    isAdmin,
  }
) => {
    //Se encrypta la clave del usuario usando un hash de 10
    const userPassword= bcrypt.hashSync(body.password, 10);
    const user = {
        name_user: body.name_user,
        last_name_user : body.last_name_user,
        identification_number: body.identification_number,
        email : body.email,
        password: userPassword,
        created_at: new Date(Date.now()),
    }

    const token = jwt.sign({user}, process.env.JWT_SECRET_KEY, {expiresIn: '60d'});
    const timestamp = moment().add(60, 'days').unix();
    user.access_token= token;
    user.token_expires_in=timestamp;
    user.status= constants.STATUS_ACTIVE;
    const userCreated = await createUser({ user });
    //fix de token
    user.id_users = userCreated[0].id_users;
    const token2 = jwt.sign({user}, process.env.JWT_SECRET_KEY, {expiresIn: `${process.env.JWT_TOKEN_DURATION}d`});
    const timestamp2 = moment().add(process.env.JWT_TOKEN_DURATION, 'days').unix();
    user.access_token= token2;
    user.token_expires_in=timestamp2;
    await updateUser({user});


    //Se debe asociar el user al rol admin o al rol client
    const userAssociateWithCompany = await createCompanyUser(body.company_id, user.id_users, constants.STATUS_ACTIVE);
    await createUserRol(userAssociateWithCompany &&  userAssociateWithCompany.length > 0 
      ? userAssociateWithCompany[0].id_company_user : null, 
      isAdmin ? constants.ADMIN_ROL: constants.CLIENT_ROL
    );

    return user;
}
module.exports = { 
  getUserByEmail,
  createUser,
  getUsersByCompany,
  getUserByCompanyAndEmail,
  getUserById,
  updateUserSessionData,
  updateUser,
  deleteUser,
  validateUserData,
  createUserLogic, 
  validateUserLoginData,
  getUserByEmailRolClient
};
