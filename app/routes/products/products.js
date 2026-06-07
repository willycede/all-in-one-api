const express = require('express')
const router = express.Router()
const productController = require('../../controllers/productController')
const { verifyToken, assertAdmin } = require('../../middleware/auth')
const uploadProductImage = require('../../config/multerProductImages')

router.get('/get/randomProducts', productController.getRandomProducts);
router.get('/by_product_id/:product_id', productController.getProductsByProductId);
router.post('/createProduct', verifyToken, assertAdmin, productController.CreateProducts);
router.put('/updateProduct', verifyToken, assertAdmin, productController.putProduct);
router.post(
	'/:product_id/images',
	verifyToken,
	assertAdmin,
	uploadProductImage.single('image'),
	productController.uploadProductImage
);
router.delete(
	'/:product_id/images/:image_id',
	verifyToken,
	assertAdmin,
	productController.deleteProductImage
);
router.get('/:category_id', productController.getProductsByCategoryId);

module.exports = router;