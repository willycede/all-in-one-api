const shoppingModel = require('../models/shopping')
const response = require('../config/response');

require('dotenv').config()

const axios = require('axios');


const createShoppingCarCtr = async (req, res) => {

    let validationObject = {}
    try {

        let RegistroShopCab = {};
        const body = req.body;

        /*Validamos si existe un registro previo de un carrito activo al usuario */

        var id_user = body.id_user

        if (id_user > 0) {

            const ShoppCarActi = await shoppingModel.getShoppingCarActiveByUser(id_user);

            if (Object.entries(ShoppCarActi).length > 0) {

                var id_shopping_car = ShoppCarActi[0].id_shopping_car;

                const UpdateShopCar = await shoppingModel.putShoppingUpdate(
                    id_shopping_car,
                    {
                        body
                    }
                );

                RegistroShopCab = UpdateShopCar;

            } else {

                /*Insertamos la cabecera */

                const validatedData = await shoppingModel.validateShoppinData({
                    body
                });

                if (Object.entries(validatedData.validationObject).length > 0 || validatedData.errorMessage) {
                    return response.error(req, res, { message: validatedData.errorMessage, validationObject: validatedData.validationObject }, 422);
                }

                const createdShopp = await shoppingModel.createShoppingMetodo(
                    {
                        body
                    }
                );

                RegistroShopCab = createdShopp;

            }

        }

        return response.success(req, res, RegistroShopCab, 200);
    } catch (error) {
        return response.error(req, res, { message: `createdShoppError: ${error.message}`, validationObject }, 422)
        return response.error(req, res, { message: `createdShoppError: ${error.message}` }, 422)
    }

};

const createShoppingCarDetailsCtr = async (req, res) => {

    let validationObject = {}
    try {

        let subtotalshop = 0;
        let totalival = 0;
        let total = 0;
        let totaldiscount = 0;
        let RegistroShopDetails = {};

        var body = req.body;
        var id_details = body.id_details


        //si el id del detalle es mayor a 0 actualizamos el detalle
        if (id_details == 0) {

            /*Insertamos la cabecera */
            const createdShoppDetails = await shoppingModel.createShoppingDetailsMetodo
                (
                    {
                        body
                    }
                );

            const shopCarDetails = await shoppingModel.getShopDetailsCarByIdShop(body.id_shopping_car);

            /* obtenemos detalles ingresados para calcular totales */
            for(var attributename in shopCarDetails){

                subtotalshop = subtotalshop + parseFloat(shopCarDetails[attributename].details_subtotal);
                totalival = totalival + parseFloat(shopCarDetails[attributename].details_iva);
                total = total + parseFloat(shopCarDetails[attributename].details_total);
                totaldiscount = totaldiscount + parseFloat(shopCarDetails[attributename].details_discount);
            
            }

            let id_shopping_car = body.id_shopping_car;
            let id_user = body.id_user;

            body = {
                "id_user": id_user,
                "shopping_car_quantity": 0,
                "shopping_car_subtotal": parseFloat(subtotalshop).toFixed(6),
                "shopping_car_total_discount":parseFloat(totaldiscount).toFixed(6),
                "shopping_car_iva": parseFloat(totalival).toFixed(6),
                "shopping_car_total": parseFloat(total).toFixed(6),
                "status": 1             
            }

            /*actualizamos los detalles */
            await shoppingModel.putShoppingUpdate(
                id_shopping_car,
                {
                    body
                }               
                
            );

            RegistroShopDetails = createdShoppDetails;



        } else {

            const UpdateShoppDetails = await shoppingModel.putShoppingDetailsUpdate
                (
                    id_details,
                    {
                        body
                    }
                );

            const shopCarDetails = await shoppingModel.getShopDetailsCarByIdShop(body.id_shopping_car);

            /* obtenemos detalles ingresados para calcular totales */
            for(var attributename in shopCarDetails){

                subtotalshop = subtotalshop + parseFloat(shopCarDetails[attributename].details_subtotal);
                totalival = totalival + parseFloat(shopCarDetails[attributename].details_iva);
                total = total + parseFloat(shopCarDetails[attributename].details_total);
                totaldiscount = totaldiscount + parseFloat(shopCarDetails[attributename].details_discount);
            
            }

            let id_shopping_car = body.id_shopping_car;
            let id_user = body.id_user;

            body = {
                "id_user": id_user,
                "shopping_car_quantity": 0,
                "shopping_car_subtotal": parseFloat(subtotalshop).toFixed(6),
                "shopping_car_total_discount":parseFloat(totaldiscount).toFixed(6),
                "shopping_car_iva": parseFloat(totalival).toFixed(6),
                "shopping_car_total": parseFloat(total).toFixed(6),
                "status": 1             
            }

            /*actualizamos los detalles */
            await shoppingModel.putShoppingUpdate(
                id_shopping_car,
                {
                    body
                }               
                
            );

            RegistroShopDetails = UpdateShoppDetails;



            //si el detalle es 0 insertamos el nuevo detalle

        }

        return response.success(req, res, RegistroShopDetails, 200);
    } catch (error) {
        return response.error(req, res, { message: `createShoppingCarDetailsCtrError: ${error.message}`, validationObject }, 422)
    }

};

const getShoppCar = async (req, res) => {
    try {

        const id_user = parseInt(req.params.id_user);

        const shopCar = await shoppingModel.getShoppingCarActiveByUser(id_user)
        return response.success(req, res, shopCar, 200)

    } catch (error) {
        return response.error(req, res, { message: `getShopping: ${error.message}` }, 422)
    }
}

const getShoppCarDetails = async (req, res) => {
    try {

        const id_shopping_car = parseInt(req.params.id_shopping_car);

        const shopCarDetails = await shoppingModel.getShopDetailsCarByIdShop(id_shopping_car)
        return response.success(req, res, shopCarDetails, 200)

    } catch (error) {
        return response.error(req, res, { message: `getShopDetails: ${error.message}` }, 422)
    }
}

const ShppoingCarUrlPay = async (req, res) => {

   

    try {

        const body = req.body;

        var data = JSON.stringify({
            "amount": body.amount,
            "tax": body.tax,
            "amountWithTax": body.amountWithTax,
            "amountWithoutTax": body.amountWithoutTax,
            "service": body.service,
            "tip": body.tip,
            "currency": "USD",
            "reference": "COBRO, ALL IN ONE",
            "clientTransactionId": body.clientTransactionId,
            "oneTime": false,
            "expireIn": 0
        });

        var config = {
            method: 'post',
            url: process.env.PAYURL,
            headers: {
                'Authorization': 'Bearer ' + process.env.PAYTOKEN,
                'Content-Type': 'application/json'
            },
            data: data
        };

        const respuesta = await axios(config);
        const jsonResp = {
            url: respuesta.data,
            errorCode:200
        }
 
        return res.status(200).send(jsonResp)
    } catch (error) {
        return res.status(200).send(error.response.data)
    }

}

const putUpdateShoppingPay = async (req, res) =>{

    var body = req.body;
    let id_shopping_car = body.id_shopping_car;

    body = {
        "url_payphone": body.url_payphone,
        "status": body.status            
    }

    await shoppingModel.putShoppingUpdate(
        id_shopping_car,
        {
            body
        }               
        
    );

}


module.exports = {
    createShoppingCarCtr,
    createShoppingCarDetailsCtr,
    getShoppCar,
    getShoppCarDetails,
    ShppoingCarUrlPay,
    putUpdateShoppingPay
}