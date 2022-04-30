const express = require('express')
const router = express.Router()
const citiesController = require('../../controllers/cityController')

router.get('/getCities/:state_id', citiesController.getCitiesByStateId)


module.exports = router;