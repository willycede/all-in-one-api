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

module.exports = {  
  createUser,
  getUserByEmail,
  login,
  loginAdmin
};
