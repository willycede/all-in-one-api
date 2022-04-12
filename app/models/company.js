//Import necessary libraries
const generalConstants = require('../constants/constants')
const utils = require('../utils/globalFunctions')
const knex = require('../db/knex')

const createCompany = async ({ company }) => {
    console.log(company);
    const company_insert = await knex('company').insert(company)
    
    console.log("este es un mensaje : ",company_insert[0]);

    return await knex.select()
    .from('company')
    .where({
      id_company:company_insert[0]
    });
};


const validateCompanyData = async ({
    body
  }) => {

    let validationObject ={};
    let errorMessage = "";

    if(!body.name){
      validationObject.name = "El nombre es requerido y no puede ser vacio o nulo";
    }
    if(!body.description){
      validationObject.description = "La descripción es requerido y no puede ser vacio o nulo";
    }
    if(!body.phone){
      validationObject.phone = "El número de telefono es requerido y no puede ser vacio o nulo";
    }
    if(!body.email){
      validationObject.email = "El email es requerido y no puede ser vacio o nulo";
    }

    console.log(body.email);
    
    let valiteIdentification= utils.validarRuc(body.ruc)
    if(valiteIdentification.status==0){
        validationObject.ruc=valiteIdentification.message;
    }

    return {
      validationObject,
      errorMessage
    };
    
  }

const createCompanyMetodo = async (
    {
        body
    }
) => {

    const company = {
        name: body.name,
        ruc: body.ruc,
        description: body.description,
        phone: body.phone,
        status: body.status,
        email: body.email,
        created_at: new Date(Date.now()),
    }

    console.log(company);

    /*
    const token = jwt.sign({ company }, process.env.JWT_SECRET_KEY, { expiresIn: '60d' });
    const timestamp = moment().add(60, 'days').unix();
    company.access_token = token;
    company.token_expires_in = timestamp;
    company.status = constants.STATUS_ACTIVE;
*/
console.log('sdsdsdsdsd')
    const createCompanyObje = await createCompany({ company });

    //console.log('asasasasasfdfdfddfdf')
    company.id_companny = createCompanyObje[0].id_company;
   /*
    const token2 = jwt.sign({ company }, process.env.JWT_SECRET_KEY, { expiresIn: `${process.env.JWT_TOKEN_DURATION}d` });
    const timestamp2 = moment().add(process.env.JWT_TOKEN_DURATION, 'days').unix();
    
    company.access_token = token2;
    company.token_expires_in = timestamp2;*/
  
    return company;
}

//get all roles with status 1 
const getCompany = async () => {
    return await knex.select()
        .from('company')
        .where({ status: generalConstants.STATUS_ACTIVE })
        .orderBy('name', 'asc')
}
module.exports = {
    getCompany, createCompanyMetodo,createCompany,validateCompanyData,
}