const express = require('express')
const router = express.Router()
const productController = require('../../controllers/productController')

router.get('/:category_id', productController.getProductsByCategoryId)
router.get('/by_product_id/:product_id', productController.getProductsByProductId)

module.exports = router;