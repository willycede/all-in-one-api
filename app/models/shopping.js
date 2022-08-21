const constants = require("../constants/constants");

const generalConstants = require('../constants/constants')
const utils = require('../utils/globalFunctions')
const knex = require('../db/knex')

const putCompanyUpdate = async (id_shopping_car, {body}, trx) => {


    await (trx || knex)('shopping_car')
    .where('id_shopping_car', '=', id_shopping_car)
    .update(
    {
        shopping_car_quantity: body.shopping_car_quantity,
        shopping_car_subtotal: body.shopping_car_subtotal,
        shopping_car_iva: body.shopping_car_iva,
        shopping_car_total: body.shopping_car_total,
        updated_at:knex.fn.now()
    });

    return await getShoppingCar(id_shopping_car);

};

const putShoppingDetailsUpdate = async (id_details, {body}, trx) => {


    await (trx || knex)('shopping_car_details')
    .where('id_details', '=', id_details)
    .update(
    {
        details_quantity: body.details_quantity, 
        details_price: body.details_price, 
        details_discount: body.details_discount, 
        details_subtotal: body.details_subtotal, 
        details_iva: body.details_iva, 
        details_total: body.details_total, 
        updated_at:knex.fn.now()
        
    });

    return await knex.select()
        .from('shopping_car_details')
        .where({
            id_details:body.id_details
        });

};

const getShopDetailsCarByIdShop = async (id_shopping_car) => {

    const query = {
        id_shopping_car : id_shopping_car,
        status: generalConstants.STATUS_ACTIVE
    }

    return await knex('shopping_car_details as d')
        .join('products as p', 'p.id_products', 'd.id_product')
        .join('product_images as pi', 'pi.product_id', 'p.id_products')
        .select
        (
            'd.id_product','p.cod_products','p.name','p.description', 
            'd.id_details', 'd.id_shopping_car','d.details_quantity',
            'd.details_price','d.details_discount','d.details_subtotal',
            'd.details_iva','d.details_total','pi.url','pi.name as name_img'
        )
        .where(
            {
                'd.id_shopping_car' : id_shopping_car,
                'd.status': generalConstants.STATUS_ACTIVE
            }
        );

};

const getShoppingCar = async (id_shopping_car) => {

    const query = {
        id_shopping_car:id_shopping_car
    }

    return await knex.select()
        .from('shopping_car')
        .where(query)

};

const getShoppingCarActiveByUser = async (id_user) => {

    const query = {
        id_user,
        status: generalConstants.STATUS_ACTIVE
    }

    return await knex.select()
        .from('shopping_car')
        .where(query);
        //.first();
};

const createShoppingCar = async ({shopping_car}) => {

    const shopp_insert = await knex('shopping_car').insert(shopping_car)

    return await knex.select()
    .from('shopping_car')
    .where({
        id_shopping_car:shopp_insert[0]
    });

};

const validateShoppinData = async ({
    body
  }) => {

    let validationObject ={};
    let errorMessage = "";

    if(body.shopping_car_subtotal <= 0){
      validationObject.shopping_car_subtotal = "El subtotal no puede ser 0.00";
    }
    if(body.shopping_car_total <= 0){
      validationObject.description = "El total de la compra no puede ser 0.00";
    }
    
    return {
      validationObject,
      errorMessage
    };
    
};

const createShoppingCarDetails = async ({ shopping_car_details }) => {
   

    const shoppdetails_insert = await knex('shopping_car_details').insert(shopping_car_details)

    return await knex.select()
    .from('shopping_car_details')
    .where({
        id_details:shoppdetails_insert[0]
    });

};

const createShoppingMetodo = async (
    {
        body
    }
) =>{

    const shopping_car = {
        id_user: body.id_user,
        shopping_car_quantity: body.shopping_car_quantity,
        shopping_car_subtotal: body.shopping_car_subtotal,
        shopping_car_iva: body.shopping_car_iva,
        shopping_car_total: body.shopping_car_total,
        status: body.status,
        created_at: new Date(Date.now()),
    }

    const createShoppingObje = await createShoppingCar({ shopping_car });

    return createShoppingObje;

};

const createShoppingDetailsMetodo = async (
    {
        body
    }
) =>{

    const shopping_car_details = {

        id_shopping_car: body.id_shopping_car, 
        id_product: body.id_product, 
        details_quantity: body.details_quantity, 
        details_price: body.details_price, 
        details_discount: body.details_discount, 
        details_subtotal: body.details_subtotal, 
        details_iva: body.details_iva, 
        details_total: body.details_total, 
        created_at: new Date(Date.now()), 
        status: body.status
    }

    const createShoppingDetailsObje = await createShoppingCarDetails({ shopping_car_details });

    return createShoppingDetailsObje;

};

module.exports = {
    getShoppingCar, 
    getShoppingCarActiveByUser,
    getShopDetailsCarByIdShop,
    createShoppingMetodo,
    createShoppingCar,    
    createShoppingDetailsMetodo,
    validateShoppinData,
    putCompanyUpdate,
    putShoppingDetailsUpdate,
}