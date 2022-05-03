const express = require('express')
const router = express.Router()
const catalogController = require('../../controllers/catalogController')

router.get("/getCatalogs", catalogController.getCatalogs)
router.put("/updateCatalog/:id_catalog", catalogController.updateCatalog);
router.delete("/deleteCatalog/:id_catalog", catalogController.deleteCatalog);
router.post("/createCatalog", catalogController.createCatalog);


module.exports = router;