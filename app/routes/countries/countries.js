const express = require('express')
const router = express.Router()
const countriesController = require('../../controllers/countryController')

router.get('/', countriesController.getCountries)


module.exports = router;