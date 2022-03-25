const userModel =  require("../models/user")
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const moment = require('moment');
const response = require('../config/response');
const utils = require('../utils/globalFunctions')
const constants = require("../constants/constants");
const { getUserByCompanyAndEmail } = require("../models/company_users");
require('dotenv').config()
const getUserByEmail = async ({email}) => {
    
  const userEmail = await userModel.getUserByEmail({email})
  return userEmail;
};
const createUser = async (req,res) => {
  let validationObject ={}
  try {
    let errorMessage=''
    const body = req.body;
    if(!body.company_id){
      body.company_id =null;
    }
    //Se valida que venga toda la data del usuario
    if(body.first_name == null || body.first_name==undefined || body.first_name ==''){
      validationObject.first_name = "El primer nombre es requerido y no puede ser vacio o nulo"
    }
    if(body.second_name == null || body.second_name==undefined || body.second_name ==''){
      validationObject.second_name = "El segundo nombre es requerido y no puede ser vacio o nulo"
    }
    if(body.first_last_name == null || body.first_last_name==undefined || body.first_last_name ==''){
      validationObject.first_last_name = "El primer apellido es requerido y no puede ser vacio o nulo"
    }
    if(body.second_last_name == null || body.second_last_name==undefined || body.second_last_name ==''){
      validationObject.second_last_name = "El segundo apellido es requerido y no puede ser vacio o nulo"
    }
    if(body.email == null || body.email==undefined || body.email ==''){
      validationObject.email = "El email es requerido y no puede ser vacio o nulo"
    }
    if(body.password == null || body.password==undefined || body.password ==''){
      validationObject.password = "La contraseña es requerida y no puede ser vacia o nula"
    }
    if(body.cellphone_number == null || body.cellphone_number==undefined || body.cellphone_number ==''){
      validationObject.cellphone_number = "El número de telefono es requerido y no puede ser vacio o nulo"
    }
    if(body.identification_number == null || body.identification_number==undefined || body.identification_number ==''){
      validationObject.identification_number = "El número de cedula es requerido y no puede ser vacio o nulo"
    }
    if(body.address == null || body.address==undefined || body.address ==''){
      validationObject.address = "La dirección es requerida y no puede ser vacia o nula"
    }
    if(body.city_id == null || body.city_id==undefined || body.city_id ==''){
      validationObject.location_id = "La ciudad es requerida y no puede ser vacia o nula"
    }
    //validate cedula
    let valiteIdentification= utils.validarRucCedula(body.identification_number)
    if(valiteIdentification.status==0){
        validationObject.identification_number=valiteIdentification.message
        return response.error(req,res,{message:errorMessage, validationObject}, 422)
    }


    if(errorMessage!='' || Object.entries(validationObject).length>0){
      return response.error(req,res,{message:errorMessage, validationObject}, 422)
    }
    

    //Se comprueba si el usuario se encuentra registrado por su email
    const userDb = await getUserByEmail({email:body.email})
    if(userDb!=undefined|| userDb!=null){
        errorMessage= `El usuario con email ${body.email} ya existe en nuestros registros`
        return response.error(req,res,{message:errorMessage, validationObject}, 422)
    }
    //Se encrypta la clave del usuario usando un hash de 10
    const userPassword= bcrypt.hashSync(body.password, 10);
    //Se recuperan los datos del usuario
    console.log("TYPEID",body.user_type_id)
    const user = {
        first_name: body.first_name,
        second_name : body.second_name,
        first_last_name: body.first_last_name,
        second_last_name: body.second_last_name,
        email : body.email,
        password: userPassword,
        cellphone_number: body.cellphone_number,
        identification_number : body.identification_number,
        address:body.address,
        city_id:body.city_id,
        company_id:body.company_id,
        user_type_id: !body.user_type_id? 1 :  body.user_type_id
    }
    console.log("USERRRR" ,user)
    const token = jwt.sign({user}, process.env.JWT_SECRET_KEY, {expiresIn: '60d'});
    const timestamp = moment().add(60, 'days').unix();
    user.access_token= token;
    user.token_expires_in=timestamp
    user.status= constants.STATUS_ACTIVE;
    const userCreated = await userModel.createUser({ user })
    //fix de token
    user.id = userCreated[0].id
    const token2 = jwt.sign({user}, process.env.JWT_SECRET_KEY, {expiresIn: '720d'});
    const timestamp2 = moment().add(720, 'days').unix();
    user.access_token= token2;
    user.token_expires_in=timestamp2
    user.status= constants.STATUS_ACTIVE;
    await userModel.updateUser({user})
    
    return response.success(req,res,{message:"Usuario creado con exito"},200)
  } catch (error) {
    return response.error(req,res,{message:`createUserError: ${error.message}`,validationObject}, 422)
  }
  
};
const login = async (req,res) => {
  try {
    const body = req.body;
    const email = body.email;
    const password= body.password;
    const validatedData = await userModel.validateUserLoginData({email, password, isAdmin: false});
    if(Object.entries(validatedData.validationObject).length>0){
      return response.error(req,res,{message:validatedData.errorMessage, validationObject: validatedData.validationObject}, 422)
    }
    const user = getUserByEmail({
      email
    });
    if (!user) {
      return response.error(req,res,{message:'No existe un usuario con el email ingresado'}, 422)
    }
    user.id_users = user.id_users;
    const token= jwt.sign({user}, process.env.JWT_SECRET_KEY, {expiresIn: '720d'});
    const timestamp = moment().add(720, 'days').unix();
    user.access_token= token;
    user.token_expires_in=timestamp;
    await userModel.updateUser({user})

    return response.success(req,res,user,200)
  } catch (error) {
    return response.error(req,res,{message:`LoginError: ${error.message}`}, 422)
  }
  
};

const loginAdmin = async (req,res) => {

  try {
    const body = req.body;
    const email = body.email;
    const password= body.password;
    const company_id = body.company_id;
    userModel.Z({email, password, isAdmin: true});
    if(Object.entries(validatedData.validationObject).length>0){
      return response.error(req,res,{message:validatedData.errorMessage, validationObject: validatedData.validationObject}, 422)
    }
    const user = userModel.getUserByCompanyAndEmail({
      email,
      company_id
    });
    if (!user) {
      return response.error(req,res,{message:'No existe un usuario con el email ingresado'}, 422)
    }
    user.id_users = user.id_users;
    const token= jwt.sign({user}, process.env.JWT_SECRET_KEY, {expiresIn: '720d'});
    const timestamp = moment().add(720, 'days').unix();
    user.access_token= token;
    user.token_expires_in=timestamp;
    await userModel.updateUser({user})

    return response.success(req,res,user,200)
  } catch (error) {
    return response.error(req,res,{message:`LoginError: ${error.message}`}, 422)
  }
  
};

module.exports = {  
  createUser,
  getUserByEmail,
  login,
  loginAdmin
};
