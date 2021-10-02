const express = require('express');
const router = express.Router();
const response = require('../../config/response');

router.get('/', function (req, res){
    //para ver cabeceras es 
    //para mandar cabeceras persoalizadas al cliente es
    res.header({
        "custom-header":"my header"
    })
    response.success(req,res,"Data obtenida");
})

module.exports = router;