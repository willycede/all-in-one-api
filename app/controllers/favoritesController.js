const favoritesModel = require('../models/favorites');
const response = require('../config/response');

const friendlyMessage = (error) => {
	if (error.code === 'ER_NO_SUCH_TABLE' || /doesn't exist/i.test(error.message || '')) {
		return 'Los favoritos no están disponibles. Reinicia la API para aplicar las migraciones.';
	}
	return error.message;
};

const getFavorites = async (req, res) => {
	try {
		const id_user = parseInt(req.params.id_user, 10);
		if (!id_user) {
			return response.error(req, res, { message: 'El id del usuario es requerido' }, 422);
		}

		const favorites = await favoritesModel.getFavoritesByUser(id_user);
		return response.success(req, res, favorites, 200);
	} catch (error) {
		return response.error(req, res, { message: friendlyMessage(error) }, 422);
	}
};

const addFavorite = async (req, res) => {
	try {
		const { id_user, id_product } = req.body;

		if (!id_user) {
			return response.error(req, res, { message: 'El id del usuario es requerido' }, 422);
		}
		if (!id_product) {
			return response.error(req, res, { message: 'El id del producto es requerido' }, 422);
		}

		const favorite = await favoritesModel.addFavorite({
			id_user: parseInt(id_user, 10),
			id_product: parseInt(id_product, 10),
		});

		return response.success(req, res, favorite, 200);
	} catch (error) {
		return response.error(req, res, { message: friendlyMessage(error) }, 422);
	}
};

const removeFavorite = async (req, res) => {
	try {
		const { id_user, id_product, id_favorite } = req.body;

		if (!id_user) {
			return response.error(req, res, { message: 'El id del usuario es requerido' }, 422);
		}

		const result = await favoritesModel.removeFavorite({
			id_user: parseInt(id_user, 10),
			id_product: id_product ? parseInt(id_product, 10) : null,
			id_favorite: id_favorite ? parseInt(id_favorite, 10) : null,
		});

		return response.success(req, res, result, 200);
	} catch (error) {
		return response.error(req, res, { message: friendlyMessage(error) }, 422);
	}
};

const checkFavorite = async (req, res) => {
	try {
		const id_user = parseInt(req.params.id_user, 10);
		const id_product = parseInt(req.params.id_product, 10);

		const isFavorite = await favoritesModel.isProductFavorite(id_user, id_product);
		return response.success(req, res, { isFavorite }, 200);
	} catch (error) {
		return response.error(req, res, { message: friendlyMessage(error) }, 422);
	}
};

module.exports = {
	getFavorites,
	addFavorite,
	removeFavorite,
	checkFavorite,
};
