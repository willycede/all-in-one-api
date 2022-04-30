const express = require('express')
const router = express.Router()
const countriesController = require('../../controllers/countryController')

router.get('/getCountries', countriesController.getCountries)


module.exports = router;