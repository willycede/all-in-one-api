const userModel =  require("../models/user")
const bcrypt = require('bcryptjs');

const response = require('../config/response');
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

module.exports = {  
  createUser,
  getUserByEmail,
  login
};
