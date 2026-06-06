const express = require('express');
const router = express.Router();
const favoritesController = require('../../controllers/favoritesController');

router.get('/:id_user', favoritesController.getFavorites);
router.get('/check/:id_user/:id_product', favoritesController.checkFavorite);
router.post('/add', favoritesController.addFavorite);
router.post('/remove', favoritesController.removeFavorite);

module.exports = router;
