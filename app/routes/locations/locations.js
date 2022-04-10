const express = require('express');
const router = express.Router();
const locationController = require('../../controllers/locationController')

router.post("/createLocation", locationController.createLocation);
router.put("/updateLocation/:id_location", locationController.updateLocation);
router.delete("/deleteLocation/:id_location", locationController.deleteLocation);
router.get("/getLocation", locationController.getLocations);
module.exports = router;