const express = require('express');
const router = express.Router();
const featureController = require('../../controllers/featureController')

router.post("/createFeature", featureController.createFeature);
router.put("/updateFeature/:id_products/:id_category/:id_catalogo", featureController.updateFeature);
router.delete("/deleteFeature/:id_products/:id_category/:id_catalogo", featureController.deleteFeature);
router.get("/getFeatures", featureController.getFeatures);
module.exports = router;