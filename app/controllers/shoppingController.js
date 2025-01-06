const fs = require('fs');

const shoppingModel = require('../models/shopping')
const response = require('../config/response');

const SibApiV3Sdk = require('sib-api-v3-sdk');


require('dotenv').config()

const axios = require('axios');
const path = require('path');

//git config --global user.email "eduardo.eduardomayorga.mayorga@gmail.com"
//git config --global user.name "emayorga1991"


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
            for (var attributename in shopCarDetails) {

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
                "shopping_car_total_discount": parseFloat(totaldiscount).toFixed(6),
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
            for (var attributename in shopCarDetails) {

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
                "shopping_car_total_discount": parseFloat(totaldiscount).toFixed(6),
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

const createInvoiceDataCtr = async (req, res) => {

    let validationObject = {}
    try {

        
        const body = req.body;

        /*Validamos si existe un registro previo de un carrito activo al usuario */

        var id_user = body.id_user

        if (id_user > 0) {

            

                /*Insertamos la cabecera */

                const validatedData = await shoppingModel.validateInvoceData({
                    body
                });

                if (Object.entries(validatedData.validationObject).length > 0 || validatedData.errorMessage) {
                    return response.error(req, res, { message: validatedData.errorMessage, validationObject: validatedData.validationObject }, 422);
                }

                const createdDataInvoice = await shoppingModel.createInvoiceData(
                    {
                        body
                    }
                );

                RegistroDataInvoice = createdDataInvoice;


        }

        return response.success(req, res, RegistroDataInvoice, 200);
    } catch (error) {
        return response.error(req, res, { message: `createdDataInoiceError: ${error.message}`, validationObject }, 422)
        return response.error(req, res, { message: `createdDataInoiceError: ${error.message}` }, 422)
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


const getShoppCarById = async (req, res) => {
    try {

        console.log(req.params);
        const id_orden = parseInt(req.params.id_orden);
        console.log(id_orden);

        const shopCar = await shoppingModel.getShoppingCar(id_orden)
        return response.success(req, res, shopCar, 200)

    } catch (error) {
        return response.error(req, res, { message: `getShoppCarById: ${error.message}` }, 422)
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

const getInvoiceData = async (req, res) => {
    try {

        const id_user = parseInt(req.params.id_user);

        const shopDataUserInvoice = await shoppingModel.getInvoiceData(id_user)
        return response.success(req, res, shopDataUserInvoice, 200)

    } catch (error) {
        return response.error(req, res, { message: `getInvoiceData: ${error.message}` }, 422)
    }
}


const sendMailShoppFactura = async (req, res) => { 

    const body = req.body; 
    let defaultClient = SibApiV3Sdk.ApiClient.instance; 
    let apiKey = defaultClient.authentications['api-key']; 
    apiKey.apiKey = process.env.SENDMAILTOKEN; 
    
    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi(); 
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); 
    sendSmtpEmail.subject = "ALL IN ONE"; 
    sendSmtpEmail.htmlContent = body.html; 
    sendSmtpEmail.sender = { name: "All In One", email: "eduardo.eduardomayorga.mayorga@gmail.com" }; 
    sendSmtpEmail.to = [{ email: body.email, name: "All In One" }]; 
    
    const pathPdf = body.pathPdf;
    const pathXml = body.pathXml;
   
   
    try { 
        const [base64Pdf, base64Xml] = await Promise.all([ 
            fs.promises.readFile(pathPdf, { encoding: 'base64' }), 
            fs.promises.readFile(pathXml, { encoding: 'base64' }) 
        ]); 
        
        
        sendSmtpEmail.attachment = [
            { 
                name: path.basename(pathPdf), 
                content: base64Pdf 
            }, 
            { 
                name: path.basename(pathXml), 
                content: base64Xml 
            } 
        ]; 
        
        apiInstance.sendTransacEmail(sendSmtpEmail) 
        .then(function (data) { 
            const jsonResp = 
            { 
                url: 'API called successfully. Returned data: ' + JSON.stringify(data), 
                errorCode: 200 
            }; 
            return res.status(200).send(jsonResp); 
        })
        .catch(function (error) {
             return res.status(500).send(error.response.data); 
            }); 
        } catch (error) {
             console.error('Error al leer los archivos:', error); 
             return res.status(500).send({ message: 'Error al leer los archivos', error }); 
        } 
};


const sendMailShoppingCar = async (req, res) => {

    const body = req.body;

    let defaultClient = SibApiV3Sdk.ApiClient.instance;

    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey =  process.env.SENDMAILTOKEN;

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = "ALL IN ONE";
    sendSmtpEmail.htmlContent = body.html;
    sendSmtpEmail.sender = { "name": "All In One", "email": "eduardo.eduardomayorga.mayorga@gmail.com" };
    sendSmtpEmail.to = [{ "email": body.email, "name": "All In One" }];

    apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
        const jsonResp = {
            url: 'API called successfully. Returned data: ' + JSON.stringify(data),
            errorCode: 200
        }

        return res.status(200).send(jsonResp)

    }, function (error) {
        console.log(error);
        return res.status(200).send(error.response.data)
    });

}

const ShppoingCarUrlPayConfirm = async (req, res) => {

    try {

        const body = req.body;
        let orden = body.orden;

        var data = JSON.stringify({
            "id": body.id,
            "clientTxId": body.clientId
        });



        var config = {
            method: 'post',
            url: process.env.PAYURLBTNCONFIRM,
            headers: {
                'Authorization': 'Bearer ' + process.env.PAYTOKENBTN,
                'Content-Type': 'application/json'
            },
            data: data
        };

         //console.log(config);

        const respuesta = await axios(config);

        /* actualizamos el estado de pago del registro de pedido, si el estus de codigo es statusCode 3 */


        if(respuesta.data.statusCode){

            const UpdateShopCar = await shoppingModel.putShoppingUpdatePago(
                orden
            );
        }



        const jsonResp = {
            url: respuesta.data,
            errorCode: 200
        }

        return res.status(200).send(jsonResp)
    } catch (error) {
        return res.status(200).send(error.response.data)
    }

}


const getInoviceE = async (req, res) => {
    try {

        
        const id_orden = parseInt(req.params.id_orden);
        
        //console.log(id_orden);

        var config = {
            method: 'post',
            url: process.env.URLAPIFELECTRONICA,
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                codigo: id_orden,
                path: process.env.PATHCOMPROBANTE,
                namefile:'factura',
                jasper_file:process.env.PATHJASPER
            }
        };

        const respuesta = await axios(config);
        //const jsonResp = respuesta.data

        return res.status(200).send(respuesta.data)

    } catch (error) {
        return response.error(req, res, { message: `getInoviceE: ${error.message}` }, 422)
    }
}

const ShppoingCarUrlPay = async (req, res) => {

    try {

        const body = req.body;
        //console.log(body);

        var data = JSON.stringify({
            "responseUrl": "http://45.134.226.190:8082/payment/ValidatePayment",
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
            url: process.env.PAYURLBTN,
            headers: {
                'Authorization': 'Bearer ' + process.env.PAYTOKENBTN,
                'Content-Type': 'application/json'
            },
            data: data
        };

       

        const respuesta = await axios(config);
        const jsonResp = {
            url: respuesta.data.payWithPayPhone,
            errorCode: 200
        }

        return res.status(200).send(jsonResp)
    } catch (error) {
        return res.status(200).send(error.response.data)
    }

}

const putUpdateShoppingPay = async (req, res) => {

    try {

        var body = req.body;



        let id_shopping_car = body.id_shopping_car;

        body = {
            "url_payphone": body.url_payphone,
            "status": body.status
        }



        const respuesta = await shoppingModel.putShoppingUpdatePay(
            id_shopping_car,
            {
                body
            }

        );

        
        const jsonResp = {
            url: respuesta.body,
            errorCode: 200
        }

        return res.status(200).send(jsonResp)
    } catch (error) {
        console.log(error);
        return res.status(200).send(error.response.data)
    }

}

const putUpdateInoviceState = async (req, res) => {

    try {

        var body = req.body;

        console.log(body);



        let id_shopping_car = body.orden;

        body = {
            "status_invoice": 1
        }



        const respuesta = await shoppingModel.putShoppingUpdateStateInovoice(
            id_shopping_car,
            {
                body
            }

        );

        
        const jsonResp = {
            url: respuesta.body,
            errorCode: 200
        }

        return res.status(200).send(jsonResp)
    } catch (error) {
        console.log(error);
        return res.status(200).send(error.response.data)
    }

}




module.exports = {
    createShoppingCarCtr,
    createShoppingCarDetailsCtr,
    createInvoiceDataCtr,
    getShoppCar,
    getShoppCarById,
    getShoppCarDetails,
    getInvoiceData,
    ShppoingCarUrlPay,
    putUpdateShoppingPay,
    putUpdateInoviceState,
    ShppoingCarUrlPayConfirm,
    sendMailShoppingCar,
    sendMailShoppFactura,
    getInoviceE,
}