const express = require('express');
const router = express.Router();
const favoritesController = require('../../controllers/favoritesController');
const { verifyToken, assertSelfUser } = require('../../middleware/auth');

router.get('/:id_user', verifyToken, assertSelfUser, favoritesController.getFavorites);
router.get('/check/:id_user/:id_product', verifyToken, assertSelfUser, favoritesController.checkFavorite);
router.post('/add', verifyToken, assertSelfUser, favoritesController.addFavorite);
router.post('/remove', verifyToken, assertSelfUser, favoritesController.removeFavorite);

module.exports = router;
