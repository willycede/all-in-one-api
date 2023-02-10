const userModel =  require("../models/user")
const response = require('../config/response');
const jwt = require("jsonwebtoken");
const moment = require("moment");
require('dotenv').config()
const getUserByEmail = async ({email}) => {
    
  const userEmail = await userModel.getUserByEmail({email})
  return userEmail;
};
const createUser = async (req,res) => {
  try {
    const body = req.body;
    const isAdmin = body.isAdmin;
    const validatedData = await userModel.validateUserData({
      body,
      isAdmin,
    });
    if(Object.entries(validatedData.validationObject).length>0 || validatedData.errorMessage ){
      return response.error(req,res,{message: validatedData.errorMessage, validationObject: validatedData.validationObject}, 422);
    }
    const createdUser = await userModel.createUserLogic(
      {
        body,
        isAdmin
      }
    );
    return response.success(req, res, createdUser, 200);
  } catch (error) {
    return response.error(req,res,{message:`createUserError: ${error.message}`}, 422)
  }
  
};
const login = async (req,res) => {
  try {
    const body = req.body;
    const email = body.email;
    const password= body.password;
    const validatedData = await userModel.validateUserLoginData({email, password, isAdmin: false});
    if(Object.entries(validatedData.validationObject).length>0 || validatedData.errorMessage){
      return response.error(req,res,{message:validatedData.errorMessage, validationObject: validatedData.validationObject}, 422)
    }
    const user = await userModel.getUserByEmailRolClient({
      email
    });
    user.id_users = user.id_users;
    const token= jwt.sign({
      id_users: user.id_users,
      name_user: user.name_user,
      last_name_user: user.last_name_user,
      identification_number: user.identification_number,
      email: user.email,
    }, process.env.JWT_SECRET_KEY, {expiresIn: '720d'});
    const timestamp = moment().add(720, 'days').unix();
    user.access_token= token;
    user.token_expires_in=timestamp;
    await userModel.updateUserSessionData({user})
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
    const validatedData = await userModel.validateUserLoginData({email, password, isAdmin: true, company_id});
    if(Object.entries(validatedData.validationObject).length>0 || validatedData.errorMessage){
      return response.error(req,res,{message:validatedData.errorMessage, validationObject: validatedData.validationObject}, 422);
    }
    const user = await userModel.getUserByCompanyAndEmail({
      email,
      company_id
    });
    user.id_users = user.id_users;
    const token= jwt.sign({user}, process.env.JWT_SECRET_KEY, {expiresIn: '720d'});
    const timestamp = moment().add(720, 'days').unix();
    user.access_token= token;
    user.token_expires_in=timestamp;
    await userModel.updateUserSessionData({user})

    return response.success(req,res,user,200)
  } catch (error) {
    return response.error(req,res,{message:`LoginError: ${error.message}`}, 422)
  }
  
};

const getUserById = async (req,res) => {
  try {
    const id_users = req.params.id;
    if (!id_users){
      return response.error(req,res,{message: 'El parametro id es requerido'}, 422)
    }
    const user = await userModel.getUserById({
      id_users
    });
    if (!user) {
      return response.error(req,res,{message: 'No se encontro un usuario para el id proporcionado'}, 422)
    }
    return response.success(req,res,user[0],200)
  } catch (error) {
    return response.error(req,res,{message:`getUserById: ${error.message}`}, 422)
  }
  
};

const updateUserInfo = async (req,res) => {
  try {
    const body = req.body;
    if (!body.email){
      return response.error(req,res,{message: 'El email es requerido'}, 422)
    }
    if (!body.id_users){
      return response.error(req,res,{message: 'El id del usuario es requerido'}, 422)
    }
    const id_users = parseInt(body.id_users);
    const existsUserWithNewEmail = await userModel.getUserByEmail({
      email: body.email
    });
    if (existsUserWithNewEmail && existsUserWithNewEmail.id_users !=  id_users) {
      return response.error(req,res,{message: 'Ya existe un usuario con el email ingresado'}, 422);
    }
    const user = await userModel.getUserById({
      id_users: body.id_users,
    });
    const userData = user[0];
    userData.email = body.email;
    const userUpdated = await userModel.updateUser({user:userData});
    return response.success(req,res,userUpdated[0],200)
  } catch (error) {
    return response.error(req,res,{message:`getUserById: ${error.message}`}, 422)
  }
  
};

module.exports = {  
  createUser,
  getUserByEmail,
  login,
  loginAdmin,
  getUserById,
  updateUserInfo
};
