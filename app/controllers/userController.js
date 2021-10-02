const userModel =  require("../models/user")
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const moment = require('moment');
const constants = require('../constants/constants')
const companyModel = require('../models/company')
const rolModel = require('../models/roles')
const response = require('../config/response');
const utils = require('../utils/globalFunctions')
require('dotenv').config()

const getUserByEmail = async ({email}) => {
    
    const userEmail = await userModel.getUserByEmail({email})
    return userEmail;
};
const getUsersByCompany = async(req,res)=>{
  try {
      const company_id = req.params.id
      const users = await userModel.getUsersByCompany({company_id}) 
      return response.success(req,res,users,200)
  } catch (error) {
      return response.error(req,res,{message:`getUserByCompanyError: ${error.message}`},422)
  }
}
const login = async (req,res) => {
  let validationObject ={}
  try {
    let errorMessage=''
    const body = req.body;
    const email = body.email;
    const password= body.password;
    if(email == null || email==undefined || email ==''){
      validationObject.email = "El email es requerido y no puede estar vacio o ser nulo."
    }
    if(password == null || password==undefined || password ==''){
      validationObject.password = "La contraseña es requerida y no puede estar vacia"
    }

    if(errorMessage!='' || Object.entries(validationObject).length>0){
      return response.error(req,res,{message:errorMessage, validationObject}, 422)
    }
    //Se procede a traer el usuario basado en el email, para luego comparar sus contraseñas
    const user = await getUserByEmail({email})
    if(user == null || user == undefined){
      errorMessage=`El usuario con el email ingresado no existe en nuestros registros`
      return response.error(req,res,{message:errorMessage, validationObject}, 422)
    }
    //Se compara la contraseña encryptada con la que viene
    if(!bcrypt.compareSync(password, user.password)){
      errorMessage ="Email o contraseña incorrectos."
      return response.error(req,res,{message:errorMessage, validationObject}, 422)
    }
    return response.success(req,res,user,200)
  } catch (error) {
    return response.error(req,res,{message:`LoginError: ${error.message}`}, 422)
  }
  
};
const createUser = async (req,res) => {
  let validationObject ={}
  try {
    let errorMessage=''
    const body = req.body;
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
    if(body.rol_id == null || body.rol_id==undefined || body.rol_id ==''){
      validationObject.rol_id = "El rol es requerido y no puede ser vacio o nulo"
    }
    if(body.company_id == null || body.company_id==undefined || body.company_id ==''){
      validationObject.company_id = "La compañia es requerida y no puede ser vacia o nula"
    }
    if(body.location_id == null || body.location_id==undefined || body.location_id ==''){
      validationObject.location_id = "La localidad es requerida y no puede ser vacia o nula"
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
    //validate if company and rol exists
    const existsCompany = await companyModel.getCompanyById({id:body.company_id})

    if(existsCompany== null && existsCompany==undefined && existsCompany==undefined){
      errorMessage= `La compañia con id ${body.company_id} no existe en nuestros registros`
      return response.error(req,res,{message:errorMessage, validationObject}, 422)
    }

    const existsRol = await rolModel.getRolById({id:body.rol_id})

    if(existsRol== null && existsRol==undefined && existsRol==undefined){
      errorMessage= `El rol con id ${body.rol_id} no existe en nuestros registros`
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
    const user = {
        first_name: body.first_name,
        second_name : body.second_name,
        first_last_name: body.first_last_name,
        second_last_name: body.second_last_name,
        email : body.email,
        password: userPassword,
        cellphone_number: body.cellphone_number,
        secondary_cellphone_number: body.secondary_cellphone_number?body.secondary_cellphone_number:null,
        identification_number : body.identification_number,
        address:body.address,
        rol_id:body.rol_id,
        company_id:body.company_id,
        location_id:body.location_id
    }
    const token = jwt.sign({user}, process.env.JWT_SECRET_KEY, {expiresIn: '60d'});
    const timestamp = moment().add(60, 'days').unix();
    user.access_token= token;
    user.token_expires_in=timestamp
    user.status= constants.STATUS_ACTIVE;
    const userCreated = await userModel.createUser({ user })
    //fix de token
    user.id = userCreated[0].id
    console.log('ver el user creado')
    console.log(userCreated)
    const token2 = jwt.sign({user}, process.env.JWT_SECRET_KEY, {expiresIn: '720d'});
    const timestamp2 = moment().add(720, 'days').unix();
    user.access_token= token2;
    user.token_expires_in=timestamp2
    user.status= constants.STATUS_ACTIVE;
    const userUpdated = await userModel.updateUser({user})
    
    return response.success(req,res,{message:"Usuario creado con exito"},200)
  } catch (error) {
    return response.error(req,res,{message:`createUserError: ${error.message}`,validationObject}, 422)
  }
  
};

const updateUser = async (req,res) => {
  let validationObject ={}
  try {
    let errorMessage=''
    const body = req.body;
    //Se valida que venga toda la data del usuario
    if(body.id == null || body.id==undefined || body.id ==''){
      validationObject.id = "El id del usuario es requerido y no puede ser vacio o nulo"
    }
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
    if(body.rol_id == null || body.rol_id==undefined || body.rol_id ==''){
      validationObject.rol_id = "El rol es requerido y no puede ser vacio o nulo"
    }
    if(body.company_id == null || body.company_id==undefined || body.company_id ==''){
      validationObject.company_id = "La compañia es requerida y no puede ser vacia o nula"
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
    //validate if company and rol exists
    const existsCompany = await companyModel.getCompanyById({id:body.company_id})

    if(existsCompany== null && existsCompany==undefined && existsCompany==undefined){
      errorMessage= `La compañia con id ${body.company_id} no existe en nuestros registros`
      return response.error(req,res,{message:errorMessage, validationObject}, 422)
    }

    const existsRol = await rolModel.getRolById({id:body.rol_id})

    if(existsRol== null && existsRol==undefined && existsRol==undefined){
      errorMessage= `El rol con id ${body.rol_id} no existe en nuestros registros`
      return response.error(req,res,{message:errorMessage, validationObject}, 422)
    }

    //Se comprueba si el usuario se encuentra registrado por su email
    const userDb = await userModel.getUserById({id:body.id})
    if(userDb==undefined|| userDb==null){
        errorMessage= `El usuario con id ${body.id} no existe en nuestros registros`
        return response.error(req,res,{message:errorMessage, validationObject}, 422)
    }
    //Se encrypta la clave del usuario usando un hash de 10
    const userPassword= bcrypt.hashSync(body.password, 10);
    //Se recuperan los datos del usuario
    const user = {
        id:body.id,
        first_name: body.first_name,
        second_name : body.second_name,
        first_last_name: body.first_last_name,
        second_last_name: body.second_last_name,
        email : body.email,
        password: userPassword,
        cellphone_number: body.cellphone_number,
        secondary_cellphone_number: body.secondary_cellphone_number?body.secondary_cellphone_number:null,
        identification_number : body.identification_number,
        address:body.address,
        rol_id:body.rol_id,
        company_id:body.company_id,
    }
    const token = jwt.sign({user}, process.env.JWT_SECRET_KEY, {expiresIn: '720d'});
    const timestamp = moment().add(720, 'days').unix();
    user.access_token= token;
    user.token_expires_in=timestamp
    user.status= constants.STATUS_ACTIVE;
    const userUpdated = await userModel.updateUser({user})
    
    return response.success(req,res,{message:"Usuario creado con exito"},200)
  } catch (error) {
    return response.error(req,res,{message:`updateUserError: ${error.message}`,validationObject}, 422)
  }
  
};

const deleteUser = async(req , res)=>{
  let validationObject ={}
  try {
      const body = req.body
      const id = body.id
      let errorMessage=''
      if(id == null || id==undefined || id ==''){
          errorMessage='El campo id no puede ser nulo o vacio'
          return response.error(req,res,{message:errorMessage,validationObject}, 422)
      }
      let existsUser = await userModel.getUserById({id})
      if(existsUser== null && existsUser==undefined && existsUser==undefined){
          errorMessage=`El usuario con id ${id} no existe en nuestros registros`
          return response.error(req,res,{message:errorMessage,validationObject}, 422)
      }
      //After validations we delete the user
      await userModel.deleteUser({id})
      return response.success(req,res,{},200)
  } catch (error) {
      return response.error(req,res,{message:`deleteUserError: ${error.message}`, validationObject}, 422)
  }
}
  module.exports = { getUserByEmail, createUser, login,getUsersByCompany, updateUser, deleteUser   };