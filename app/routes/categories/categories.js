const express = require('express')
const router = express.Router()
const categoryController = require('../../controllers/categoryController')

router.get("/getCategories/:company_id", categoryController.getCategoriesByCompanyId)
router.put("/updateCategory/:id_category", categoryController.updateCategory);
router.delete("/deleteCategory/:id_category", categoryController.deleteCategory);
router.post("/createCategory", categoryController.createCategory);


module.exports = router;