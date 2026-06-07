const fs = require('fs');

const shoppingModel = require('../models/shopping')
const couponsModel = require('../models/coupons');
const response = require('../config/response');
const cartValidation = require('../helpers/cartValidation');
const payphoneDebug = require('../helpers/payphoneDebug');

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
        const adminEmails = process.env.ADMIN_EMAILS.split(',');
        const emailsToSend = adminEmails.map(email => {
            return {
                "email": email,
                "name": "All In One"
            }
        });
        sendSmtpEmail.to = emailsToSend;
        sendSmtpEmail.subject = "ALL IN ONE - Nueva orden del usuario con email: " + body.email + " y nombre: " + body.name;
        apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
            const jsonResp2 = {
                url: 'API called successfully. Returned data: ' + JSON.stringify(data),
                errorCode: 200
            }
            return res.status(200).send(jsonResp2)
        })
    }, function (error) {
        console.log(error);
        return res.status(200).send(error.response.data)
    });

}

const ShppoingCarUrlPayConfirm = async (req, res) => {

    try {

        const body = req.body;
        let orden = body.orden;

        payphoneDebug.logPayphoneEnv('confirm:start');
        payphoneDebug.logPayphone('confirm:request-body', {
            orden,
            id: body.id,
            clientId: body.clientId,
        });

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

        payphoneDebug.logPayphone('confirm:axios-config', {
            url: config.url,
            authorizationBearerToken: process.env.PAYTOKENBTN,
            payload: JSON.parse(data),
        });

        const respuesta = await axios(config);

        payphoneDebug.logPayphone('confirm:success', {
            status: respuesta.status,
            data: respuesta.data,
        });

        if (respuesta.data && respuesta.data.statusCode) {
            await shoppingModel.putShoppingUpdatePago(orden);
            try {
                await couponsModel.incrementCouponUsage(orden);
            } catch (couponErr) {
                console.error('Error incrementando uso de cupón:', couponErr.message);
            }
        }

        const jsonResp = {
            url: respuesta.data,
            errorCode: 200,
            success: true,
        };

        return res.status(200).send(jsonResp);
    } catch (error) {
        payphoneDebug.logPayphoneAxiosError('confirm:error', error);
        const message = (error.response && error.response.data && error.response.data.message)
            || error.message
            || 'No se pudo confirmar el pago';
        return response.error(req, res, { message, success: false }, 422);
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

        payphoneDebug.logPayphoneEnv('prepare:start');
        payphoneDebug.logPayphone('prepare:incoming-body', { body });

        const orden = body.clientTransactionId ? String(body.clientTransactionId).split('@')[0] : null;
        if (orden) {
            const docValidation = await cartValidation.validateShoppingCartDocuments(parseInt(orden, 10));
            if (!docValidation.valid) {
                const missingItems = docValidation.items
                    .filter((item) => item.requires_documents && !item.valid)
                    .map((item) => `${item.product_name}: ${item.missing_documents.join(', ')}`)
                    .join('; ');

                return response.error(req, res, {
                    message: `Faltan documentos obligatorios antes de pagar. ${missingItems}`,
                    validation: docValidation,
                }, 422);
            }

            const cartRows = await shoppingModel.getShoppingCar(parseInt(orden, 10));
            const cart = cartRows && cartRows[0];
            if (cart && cart.coupon_code) {
                const subtotal = await couponsModel.getCartSubtotal(parseInt(orden, 10));
                const couponValidation = await couponsModel.validateCouponForCart(cart.coupon_code, subtotal);
                if (!couponValidation.valid) {
                    return response.error(req, res, {
                        message: couponValidation.message || 'El cupón aplicado ya no es válido',
                    }, 422);
                }

                const storedDiscount = parseFloat(cart.coupon_discount) || 0;
                const expectedDiscount = couponValidation.discountAmount;
                if (Math.abs(storedDiscount - expectedDiscount) > 0.02) {
                    return response.error(req, res, {
                        message: 'El descuento del cupón no coincide con el carrito. Vuelve a aplicar el cupón.',
                    }, 422);
                }

                const expectedSubtotalCents = Math.round(Math.max(0, subtotal - expectedDiscount) * 100);
                const sentSubtotalCents = parseInt(body.amountWithTax, 10);
                if (!Number.isNaN(sentSubtotalCents) && Math.abs(expectedSubtotalCents - sentSubtotalCents) > 1) {
                    return response.error(req, res, {
                        message: 'El monto enviado a Payphone no coincide con el descuento del cupón',
                    }, 422);
                }
            }
        }

        const responseUrl = process.env.PAYPHONE_RESPONSE_URL
            || `${process.env.FRONTEND_URL || 'http://localhost:8082'}/payment/ValidatePayment`;

        const storeId = process.env.PAYPHONE_STORE_ID || process.env.PAYSTOREID || null;

        const payphonePayload = {
            responseUrl: responseUrl,
            amount: body.amount,
            tax: body.tax,
            amountWithTax: body.amountWithTax,
            amountWithoutTax: body.amountWithoutTax != null ? body.amountWithoutTax : 0,
            service: body.service,
            tip: body.tip,
            currency: 'USD',
            reference: body.reference || 'COBRO, ALL IN ONE',
            clientTransactionId: body.clientTransactionId,
            oneTime: false,
            expireIn: 0,
        };

        if (storeId) {
            payphonePayload.storeId = storeId;
        } else {
            payphoneDebug.logPayphone('prepare:warning', {
                message: 'Falta PAYPHONE_STORE_ID en .env — la documentación Payphone lo marca como obligatorio (Identificador en Developer)',
            });
        }

        payphoneDebug.logPayphone('prepare:computed', {
            orden,
            responseUrl,
            storeId,
            amountCheck: {
                amount: payphonePayload.amount,
                amountWithTax: payphonePayload.amountWithTax,
                amountWithoutTax: payphonePayload.amountWithoutTax,
                tax: payphonePayload.tax,
                service: payphonePayload.service,
                tip: payphonePayload.tip,
                expectedSum: (parseInt(payphonePayload.amountWithoutTax, 10) || 0)
                    + (parseInt(payphonePayload.amountWithTax, 10) || 0)
                    + (parseInt(payphonePayload.tax, 10) || 0)
                    + (parseInt(payphonePayload.service, 10) || 0)
                    + (parseInt(payphonePayload.tip, 10) || 0),
            },
        });

        var data = JSON.stringify(payphonePayload);

        var config = {
            method: 'post',
            url: process.env.PAYURLBTN,
            headers: {
                'Authorization': 'Bearer ' + process.env.PAYTOKENBTN,
                'Content-Type': 'application/json'
            },
            data: data
        };

        payphoneDebug.logPayphone('prepare:axios-config', {
            url: config.url,
            authorizationBearerToken: process.env.PAYTOKENBTN,
            payload: payphonePayload,
        });

        const respuesta = await axios(config);

        payphoneDebug.logPayphone('prepare:success', {
            status: respuesta.status,
            payWithPayPhone: respuesta.data && respuesta.data.payWithPayPhone,
            rawData: respuesta.data,
        });

        const jsonResp = {
            url: respuesta.data.payWithPayPhone,
            errorCode: 200
        }

        return res.status(200).send(jsonResp);
    } catch (error) {
        payphoneDebug.logPayphoneAxiosError('prepare:error', error);
        const message = (error.response && error.response.data && error.response.data.message)
            || error.message
            || 'No se pudo generar el link de pago';
        return response.error(req, res, { message }, 422);
    }

};

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




const deleteShoppingCarDetailCtr = async (req, res) => {
    try {
        const body = req.body;

        if (!body.id_details) {
            return response.error(req, res, { message: 'El id del detalle es requerido' }, 422);
        }
        if (!body.id_shopping_car) {
            return response.error(req, res, { message: 'El id del carrito es requerido' }, 422);
        }

        const cartDetails = await shoppingModel.deleteShoppingCarDetail({
            id_details: parseInt(body.id_details, 10),
            id_shopping_car: parseInt(body.id_shopping_car, 10),
            id_user: body.id_user ? parseInt(body.id_user, 10) : null,
        });

        return response.success(req, res, cartDetails, 200);
    } catch (error) {
        return response.error(req, res, { message: `deleteShoppingCarDetail: ${error.message}` }, 422);
    }
};


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
    deleteShoppingCarDetailCtr,
}