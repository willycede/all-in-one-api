const fs = require('fs');

const shoppingModel = require('../models/shopping')
const couponsModel = require('../models/coupons');
const { processInvoiceAfterPayment } = require('../models/order_invoice');
const response = require('../config/response');
const payphoneCheckout = require('../helpers/payphoneCheckout');
const orderEmailDebug = require('../helpers/orderEmailDebug');
const emailSender = require('../helpers/emailSender');

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
    const pathPdf = body.pathPdf;
    const pathXml = body.pathXml;

    orderEmailDebug.logOrderEmailEnv('invoice:start');
    orderEmailDebug.logOrderEmail('invoice:request-body', {
        email: body.email,
        htmlLength: body.html ? body.html.length : 0,
        pathPdf,
        pathXml,
        pdfExists: pathPdf ? fs.existsSync(pathPdf) : false,
        xmlExists: pathXml ? fs.existsSync(pathXml) : false,
    });

    try {
        if (!process.env.SENDMAILTOKEN) {
            orderEmailDebug.logOrderEmail('invoice:error', { message: 'Falta SENDMAILTOKEN en .env' });
            return response.error(req, res, { message: 'Configuración de correo incompleta' }, 500);
        }

        let sender;
        try {
            sender = emailSender.assertEmailSenderConfigured();
        } catch (senderError) {
            orderEmailDebug.logOrderEmail('invoice:error', { message: senderError.message });
            return response.error(req, res, { message: senderError.message }, 500);
        }

        if (!body.email) {
            orderEmailDebug.logOrderEmail('invoice:error', { message: 'Email destinatario vacío' });
            return response.error(req, res, { message: 'Email requerido' }, 422);
        }

        let defaultClient = SibApiV3Sdk.ApiClient.instance;
        let apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.SENDMAILTOKEN;

        let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = "ALL IN ONE";
        sendSmtpEmail.htmlContent = body.html;
        sendSmtpEmail.sender = sender;
        sendSmtpEmail.to = [{ email: body.email, name: "All In One" }];

        const [base64Pdf, base64Xml] = await Promise.all([
            fs.promises.readFile(pathPdf, { encoding: 'base64' }),
            fs.promises.readFile(pathXml, { encoding: 'base64' })
        ]);

        sendSmtpEmail.attachment = [
            { name: path.basename(pathPdf), content: base64Pdf },
            { name: path.basename(pathXml), content: base64Xml }
        ];

        orderEmailDebug.logOrderEmail('invoice:send', {
            from: sender,
            to: body.email,
            subject: sendSmtpEmail.subject,
            attachments: [path.basename(pathPdf), path.basename(pathXml)],
        });

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

        orderEmailDebug.logOrderEmail('invoice:success', {
            messageId: data.messageId,
            data,
        });

        return res.status(200).send({
            url: 'API called successfully. Returned data: ' + JSON.stringify(data),
            errorCode: 200
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            orderEmailDebug.logOrderEmail('invoice:error', {
                message: 'No se encontró el archivo PDF o XML',
                pathPdf,
                pathXml,
                errorMessage: error.message,
            });
            return response.error(req, res, { message: 'Error al leer los archivos adjuntos' }, 500);
        }

        orderEmailDebug.logOrderEmailApiError('invoice:error', error);
        const message = (error.response && error.response.body && error.response.body.message)
            || error.message
            || 'No se pudo enviar el correo de factura';
        return response.error(req, res, { message }, 500);
    }
};


const sendMailShoppingCar = async (req, res) => {

    const body = req.body;

    orderEmailDebug.logOrderEmailEnv('order:start');
    orderEmailDebug.logOrderEmail('order:request-body', {
        email: body.email,
        name: body.name,
        order_number: body.order_number,
        subject: body.subject,
        htmlLength: body.html ? body.html.length : 0,
    });

    try {
        if (!process.env.SENDMAILTOKEN) {
            orderEmailDebug.logOrderEmail('order:error', { message: 'Falta SENDMAILTOKEN en .env' });
            return response.error(req, res, { message: 'Configuración de correo incompleta' }, 500);
        }

        let sender;
        try {
            sender = emailSender.assertEmailSenderConfigured();
        } catch (senderError) {
            orderEmailDebug.logOrderEmail('order:error', { message: senderError.message });
            return response.error(req, res, { message: senderError.message }, 500);
        }

        if (!body.email) {
            orderEmailDebug.logOrderEmail('order:error', { message: 'Email destinatario vacío' });
            return response.error(req, res, { message: 'Email requerido' }, 422);
        }

        let defaultClient = SibApiV3Sdk.ApiClient.instance;
        let apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.SENDMAILTOKEN;

        let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        const brandName = process.env.MAIL_BRAND_NAME || 'ALL IN ONE';
        const orderNumber = body.order_number ? String(body.order_number) : null;
        const customerSubject = body.subject
            || (orderNumber ? `${brandName} - Pedido #${orderNumber}` : brandName);

        sendSmtpEmail.subject = customerSubject;
        sendSmtpEmail.htmlContent = body.html;
        sendSmtpEmail.sender = sender;
        sendSmtpEmail.to = [{ email: body.email, name: body.name || "All In One" }];

        orderEmailDebug.logOrderEmail('order:send-customer', {
            from: sender,
            to: body.email,
            name: body.name,
            subject: sendSmtpEmail.subject,
        });

        const customerResult = await apiInstance.sendTransacEmail(sendSmtpEmail);

        orderEmailDebug.logOrderEmail('order:send-customer:success', {
            messageId: customerResult.messageId,
            data: customerResult,
        });

        const adminEmailsRaw = process.env.ADMIN_EMAILS;
        if (!adminEmailsRaw) {
            orderEmailDebug.logOrderEmail('order:warning', {
                message: 'ADMIN_EMAILS no configurado — no se envía copia a administradores',
            });
            return res.status(200).send({
                url: 'Correo al cliente enviado',
                errorCode: 200,
            });
        }

        const adminEmails = adminEmailsRaw.split(',').map((email) => email.trim()).filter(Boolean);
        sendSmtpEmail.to = adminEmails.map((email) => ({ email, name: "All In One" }));
        sendSmtpEmail.subject = orderNumber
            ? `${brandName} - Nueva orden #${orderNumber} — ${body.name} (${body.email})`
            : `${brandName} - Nueva orden — ${body.name} (${body.email})`;

        orderEmailDebug.logOrderEmail('order:send-admin', {
            from: sender,
            to: adminEmails,
            subject: sendSmtpEmail.subject,
        });

        const adminResult = await apiInstance.sendTransacEmail(sendSmtpEmail);

        orderEmailDebug.logOrderEmail('order:send-admin:success', {
            messageId: adminResult.messageId,
            data: adminResult,
        });

        return res.status(200).send({
            url: 'API called successfully. Returned data: ' + JSON.stringify(adminResult),
            errorCode: 200,
        });
    } catch (error) {
        orderEmailDebug.logOrderEmailApiError('order:error', error);
        const message = (error.response && error.response.body && error.response.body.message)
            || error.message
            || 'No se pudo enviar el correo del pedido';
        return response.error(req, res, { message }, 500);
    }

}

const ShppoingCarUrlPayConfirm = async (req, res) => {

    try {

        const body = req.body;
        const orden = body.orden;

        const cartRows = await shoppingModel.getShoppingCar(orden);
        const cart = cartRows && cartRows[0];

        if (!cart) {
            return response.error(req, res, {
                message: 'Orden no encontrada',
                success: false,
                step: 'order_not_found',
            }, 404);
        }

        payphoneCheckout.assertPayableOrderStatus(cart, { allowActiveCart: false });

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

        const respuesta = await axios(config);

        if (respuesta.data && respuesta.data.statusCode) {
            await shoppingModel.putShoppingUpdatePago(orden);
            try {
                await couponsModel.incrementCouponUsage(orden);
            } catch (couponErr) {
                console.error('Error incrementando uso de cupón:', couponErr.message);
            }

            let invoiceResult = null;
            try {
                invoiceResult = await processInvoiceAfterPayment(parseInt(orden, 10));
            } catch (invoiceErr) {
                console.error('Error procesando factura post-pago:', invoiceErr.message);
                invoiceResult = {
                    success: false,
                    message: invoiceErr.message,
                };
            }

            const jsonResp = {
                url: respuesta.data,
                errorCode: 200,
                success: true,
                orderId: parseInt(orden, 10),
                invoice: invoiceResult,
            };

            return res.status(200).send(jsonResp);
        }

        const jsonResp = {
            url: respuesta.data,
            errorCode: 200,
            success: true,
        };

        return res.status(200).send(jsonResp);
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message)
            || error.message
            || 'No se pudo confirmar el pago';
        return response.error(req, res, {
            message,
            success: false,
            step: error.step || undefined,
        }, error.statusCode || 422);
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
        const orderId = parseInt(
            body.id_shopping_car
            || (body.clientTransactionId ? String(body.clientTransactionId).split('@')[0] : null),
            10
        );

        if (!orderId || Number.isNaN(orderId)) {
            return response.error(req, res, { message: 'id_shopping_car es requerido' }, 422);
        }

        const userId = req.userInfo && req.userInfo.id_users;
        const sentSubtotalCents = parseInt(body.amountWithTax, 10);

        if (body.delivery) {
            await shoppingModel.updateOrderDelivery(orderId, body.delivery);
        }

        const result = await payphoneCheckout.preparePaymentLink({
            orderId,
            userId,
            amounts: {
                amount: body.amount,
                tax: body.tax,
                amountWithTax: body.amountWithTax,
                amountWithoutTax: body.amountWithoutTax != null ? body.amountWithoutTax : 0,
                service: body.service,
                tip: body.tip,
            },
            reference: body.reference,
            clientTransactionId: body.forceNewTransaction
                ? payphoneCheckout.buildClientTransactionId(orderId)
                : (body.clientTransactionId || payphoneCheckout.buildClientTransactionId(orderId)),
            allowActiveCart: true,
            sentSubtotalCents: Number.isNaN(sentSubtotalCents) ? null : sentSubtotalCents,
        });

        return res.status(200).send({
            url: result.url,
            clientTransactionId: result.clientTransactionId,
            errorCode: 200,
        });
    } catch (error) {
        const statusCode = error.statusCode || 422;
        const payload = payphoneCheckout.toPayphoneHttpPayload(
            error,
            'No se pudo generar el link de pago'
        );
        payphoneCheckout.logPayphoneFailure('controller_prepare', {
            orderId: req.body && (req.body.id_shopping_car || req.body.clientTransactionId),
            statusCode,
            ...payload,
        });
        return response.error(req, res, payload, statusCode);
    }

};

const regeneratePayphoneLink = async (req, res) => {

    try {
        const orderId = parseInt(req.body.id_shopping_car, 10);
        if (!orderId || Number.isNaN(orderId)) {
            return response.error(req, res, { message: 'id_shopping_car es requerido', step: 'validation' }, 422);
        }

        const userId = req.userInfo && req.userInfo.id_users;
        const cart = await payphoneCheckout.getOrderForPayment(orderId, userId);
        payphoneCheckout.assertPayableOrderStatus(cart, { allowActiveCart: false });

        const result = await payphoneCheckout.preparePaymentLink({
            orderId,
            userId,
            reference: `PAGO ORDEN DE PAGO #${orderId}`,
            clientTransactionId: payphoneCheckout.buildClientTransactionId(orderId),
            allowActiveCart: false,
        });

        return res.status(200).send({
            url: result.url,
            clientTransactionId: result.clientTransactionId,
            errorCode: 200,
        });
    } catch (error) {
        const statusCode = error.statusCode || 422;
        const payload = payphoneCheckout.toPayphoneHttpPayload(
            error,
            'No se pudo regenerar el link de pago'
        );
        payphoneCheckout.logPayphoneFailure('controller_regenerate', {
            orderId: req.body && req.body.id_shopping_car,
            statusCode,
            ...payload,
        });
        return response.error(req, res, payload, statusCode);
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

        let id_shopping_car = body.orden;

        const cartRows = await shoppingModel.getShoppingCar(id_shopping_car);
        const cart = cartRows && cartRows[0];

        if (!cart || !cart.invoice_access_key) {
            return response.error(req, res, {
                message: 'No se puede marcar como facturado sin comprobante generado',
            }, 422);
        }

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


const resolvePaymentLink = async (req, res) => {
    try {
        const orderId = parseInt(req.query.orden, 10) || null;
        let payphoneUrl = req.query.urlPago || null;

        if (payphoneUrl) {
            try {
                payphoneUrl = decodeURIComponent(String(payphoneUrl));
            } catch (decodeError) {
                payphoneUrl = String(payphoneUrl);
            }
        }

        const result = await payphoneCheckout.resolvePaymentLink({
            orderId: orderId && !Number.isNaN(orderId) ? orderId : null,
            payphoneUrl,
        });

        return res.status(200).send({
            url: result.url,
            orderId: result.orderId,
            errorCode: 200,
        });
    } catch (error) {
        const statusCode = error.statusCode || 422;
        const payload = payphoneCheckout.toPayphoneHttpPayload(
            error,
            'No se pudo validar el enlace de pago'
        );
        payphoneCheckout.logPayphoneFailure('controller_resolve_link', {
            orderId: req.query && req.query.orden,
            statusCode,
            ...payload,
        });
        return response.error(req, res, payload, statusCode);
    }
};


const processInvoiceForOrder = async (req, res) => {
    try {
        const orderId = parseInt(req.body.orden || req.body.id_shopping_car, 10);
        if (!orderId || Number.isNaN(orderId)) {
            return response.error(req, res, { message: 'orden es requerida' }, 422);
        }

        const userId = req.userInfo && req.userInfo.id_users;
        const cartRows = await shoppingModel.getShoppingCar(orderId);
        const cart = cartRows && cartRows[0];

        if (!cart) {
            return response.error(req, res, { message: 'Orden no encontrada' }, 404);
        }

        if (userId && parseInt(cart.id_user, 10) !== parseInt(userId, 10)) {
            return response.error(req, res, { message: 'No autorizado' }, 403);
        }

        const invoiceResult = await processInvoiceAfterPayment(orderId);
        return response.success(req, res, invoiceResult, 200);
    } catch (error) {
        return response.error(req, res, { message: error.message }, 422);
    }
};


const processInvoiceForOrder = async (req, res) => {
    try {
        const orderId = parseInt(req.body.orden || req.body.id_shopping_car, 10);
        if (!orderId || Number.isNaN(orderId)) {
            return response.error(req, res, { message: 'orden es requerida' }, 422);
        }

        const userId = req.userInfo && req.userInfo.id_users;
        const cartRows = await shoppingModel.getShoppingCar(orderId);
        const cart = cartRows && cartRows[0];

        if (!cart) {
            return response.error(req, res, { message: 'Orden no encontrada' }, 404);
        }

        if (userId && parseInt(cart.id_user, 10) !== parseInt(userId, 10)) {
            return response.error(req, res, { message: 'No autorizado' }, 403);
        }

        const invoiceResult = await processInvoiceAfterPayment(orderId);
        return response.success(req, res, invoiceResult, 200);
    } catch (error) {
        return response.error(req, res, { message: error.message }, 422);
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
    regeneratePayphoneLink,
    resolvePaymentLink,
    putUpdateShoppingPay,
    putUpdateInoviceState,
    processInvoiceForOrder,
    ShppoingCarUrlPayConfirm,
    sendMailShoppingCar,
    sendMailShoppFactura,
    getInoviceE,
    deleteShoppingCarDetailCtr,
}