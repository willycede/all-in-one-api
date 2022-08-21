const shoppingModel = require('../models/shopping')
const response = require('../config/response');

const axios = require('axios');


const createShoppingCarCtr = async (req, res) => {

    let validationObject ={}
    try {

        let RegistroShopCab ={};        
        const body = req.body;

        /*Validamos si existe un registro previo de un carrito activo al usuario */

        var id_user = body.id_user

        if(id_user > 0){

            const ShoppCarActi = await shoppingModel.getShoppingCarActiveByUser(id_user);
           
            if(Object.entries(ShoppCarActi).length > 0){

                var id_shopping_car = ShoppCarActi[0].id_shopping_car;
               
                const UpdateShopCar = await shoppingModel.putCompanyUpdate(
                    id_shopping_car,
                    {
                    body
                    }
                );
                
                RegistroShopCab = UpdateShopCar;

            }else{
                
                /*Insertamos la cabecera */

                const validatedData = await shoppingModel.validateShoppinData({
                    body
                });
        
                if (Object.entries(validatedData.validationObject).length > 0 || validatedData.errorMessage) {
                    return response.error(req, res, { message: validatedData.errorMessage, validationObject: validatedData.validationObject }, 422);
                }
        
                const createdShopp= await shoppingModel.createShoppingMetodo(
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

    let validationObject ={}
    try {

        let RegistroShopDetails = {};        
        const body = req.body;

        var id_details = body.id_details

        //si el id del detalle es mayor a 0 actualizamos el detalle
        if(id_details == 0){
                
            /*Insertamos la cabecera */

            //const validatedData = await shoppingModel.validateShoppinData({
            //    body
            //});
    
            //if (Object.entries(validatedData.validationObject).length > 0 || validatedData.errorMessage) {
            //    return response.error(req, res, { message: validatedData.errorMessage, validationObject: validatedData.validationObject }, 422);
            //}
    
            const createdShoppDetails= await shoppingModel.createShoppingDetailsMetodo
            (
                {
                    body
                }
            );

            RegistroShopDetails = createdShoppDetails;

           

        }else{

            const UpdateShoppDetails= await shoppingModel.putShoppingDetailsUpdate
            (
                id_details,
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
        return response.error(req, res, { message: `createShoppingCarDetailsCtrError: ${error.message}` }, 422)
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

const registraConfirmaShop = async (req, res)  => {

    var data = JSON.stringify({
        "amount": 11200,
        "tax": 1200,
        "amountWithTax": 10000,
        "amountWithoutTax": 0,
        "service": 0,
        "tip": 0,
        "currency": "USD",
        "reference": "PAGO COLMENA",
        "clientTransactionId": "2@127721",
        "oneTime": false,
        "expireIn": 0
      });
      
      var config = {
        method: 'post',
        url: 'https://pay.payphonetodoesposible.com/api/Links',
        headers: { 
          'Authorization': 'Bearer UOZGAgkXtoJc7mkXh_tIYP2rN4lWkZCoBZ4RuGkYvAZhQ0TLBsmHjWlYW8M3Mqub0ny9XxxzX3TaQDKSrxQ1DTtYGrdJQZI3O0-RcCLiEZS-XJxoe4hpTXc-qSY-t3dV0VamQJYxFQYJtk029dMSg8B4bZkhtkJY5oykhYMzcfp-YhZ5betjIYxHzAwLDD8pi0R3ezsDzk-gOZQFYGVvsIcBxjb9LzoJw0DyCXHLz-w6jpMdjux4eaXS_97o25Sj8xWFIbMmzh8S7mDGIsbaq9UVJLHtYaevliR0Fyd2sqlHWxm5rFiGBes6SRU3mtagqHoZYA', 
          'Content-Type': 'application/json'//, 
          //'Cookie': 'ARRAffinity=3616f83a67001ded82ad968765451192706e5d85a8a318ef9103ad4b134204a0; ARRAffinitySameSite=3616f83a67001ded82ad968765451192706e5d85a8a318ef9103ad4b134204a0'
        },
        data : data
      };
      
      axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.log(error);
      });

/*
    const arr_pay = {
      'amount':5060,
      'tax':600,
      'amountWithTax':5000,
      'currency':'USD',
      'clientTransactionId':'1@14563',
      'reference':'PAGO ORDEN DE PAGO #'
    }
    */

    //const payload = JSON.stringify(arr_pay);
    /*
    axios.defaults.headers.common = {
        //'Access-Control-Allow-Origin': '*',
        "Content-Type": 'application/json',
        "Authorization": 'Bearer ' + AppConfig.TOKEN_PAYPHONE
    };*/
   
    //axios.defaults.crossDomain = true;

    /*

    axios.post('https://pay.payphonetodoesposible.com/api/Links',arr_pay,{
      headers: {
         "Access-Control-Allow-Origin": "*",
         'content-type': 'text/json',
        
         "Authorization": 'Bearer UOZGAgkXtoJc7mkXh_tIYP2rN4lWkZCoBZ4RuGkYvAZhQ0TLBsmHjWlYW8M3Mqub0ny9XxxzX3TaQDKSrxQ1DTtYGrdJQZI3O0-RcCLiEZS-XJxoe4hpTXc-qSY-t3dV0VamQJYxFQYJtk029dMSg8B4bZkhtkJY5oykhYMzcfp-YhZ5betjIYxHzAwLDD8pi0R3ezsDzk-gOZQFYGVvsIcBxjb9LzoJw0DyCXHLz-w6jpMdjux4eaXS_97o25Sj8xWFIbMmzh8S7mDGIsbaq9UVJLHtYaevliR0Fyd2sqlHWxm5rFiGBes6SRU3mtagqHoZYA'
       }
    }).then(response =>{
      console.log(response)
    })
    .catch((e) => {
      console.log(e.message);
    })
    */
   

  }




module.exports = {
    createShoppingCarCtr,
    createShoppingCarDetailsCtr,
    getShoppCar,
    getShoppCarDetails,
    registraConfirmaShop
}