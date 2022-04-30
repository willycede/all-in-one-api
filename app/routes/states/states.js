const express = require('express')
const router = express.Router()
const stateController = require('../../controllers/stateController')

router.get('/getStates/:country_id', stateController.getStatesByCountryId)


module.exports = router;