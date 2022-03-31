const express = require('express');
const router = express.Router();
const locationController = require('../../controllers/locationController')

router.post("/createLocation", locationController.createLocation);
router.put("/updateLocation", locationController.updateLocation);
router.delete("/deleteLocation", locationController.deleteLocation);
router.get("/getLocation", locationController.getLocations);
module.exports = router;