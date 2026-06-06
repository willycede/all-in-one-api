const knex = require('../db/knex');
const generalConstants = require('../constants/constants');
const productsModel = require('./products');

const mapFavoriteRow = (row) => ({
	id_favorite: row.id_favorite,
	id_user: row.id_user,
	id_product: row.id_product,
	name: row.name,
	description: row.description,
	price: row.price,
	image: row.image || '',
});

const attachProductImage = async (row) => {
	const images = await productsModel.getListImagesByProductId(row.id_product);
	const image = images && images.length > 0 ? (images[0].url || '') : '';
	return mapFavoriteRow({ ...row, image });
};

const getFavoriteById = async (id_favorite) => {
	const row = await knex('user_favorites as f')
		.join('products as p', 'p.id_products', 'f.id_product')
		.select(
			'f.id_favorite',
			'f.id_user',
			'f.id_product',
			'p.name',
			'p.description',
			'p.price'
		)
		.where({
			'id_favorite': id_favorite,
			'f.status': generalConstants.STATUS_ACTIVE,
			'p.status': generalConstants.STATUS_ACTIVE,
		})
		.first();

	if (!row) {
		return null;
	}

	return attachProductImage(row);
};

const getFavoritesByUser = async (id_user) => {
	const rows = await knex('user_favorites as f')
		.join('products as p', 'p.id_products', 'f.id_product')
		.select(
			'f.id_favorite',
			'f.id_user',
			'f.id_product',
			'p.name',
			'p.description',
			'p.price'
		)
		.where({
			'f.id_user': id_user,
			'f.status': generalConstants.STATUS_ACTIVE,
			'p.status': generalConstants.STATUS_ACTIVE,
		})
		.orderBy('f.created_at', 'desc');

	return Promise.all(rows.map((row) => attachProductImage(row)));
};

const addFavorite = async ({ id_user, id_product }) => {
	const product = await knex('products')
		.where({ id_products: id_product, status: generalConstants.STATUS_ACTIVE })
		.first();

	if (!product) {
		throw new Error('El producto no existe o no está disponible');
	}

	const existing = await knex('user_favorites')
		.where({ id_user, id_product })
		.first();

	if (existing) {
		if (existing.status === generalConstants.STATUS_ACTIVE) {
			throw new Error('El producto ya está en favoritos');
		}

		await knex('user_favorites')
			.where({ id_favorite: existing.id_favorite })
			.update({
				status: generalConstants.STATUS_ACTIVE,
				updated_at: knex.fn.now(),
			});

		try {
			return await getFavoriteById(existing.id_favorite);
		} catch (error) {
			return mapFavoriteRow({
				id_favorite: existing.id_favorite,
				id_user,
				id_product,
				name: product.name,
				description: product.description,
				price: product.price,
				image: '',
			});
		}
	}

	const inserted = await knex('user_favorites').insert({
		id_user,
		id_product,
		status: generalConstants.STATUS_ACTIVE,
		created_at: knex.fn.now(),
		updated_at: knex.fn.now(),
	});

	try {
		return await getFavoriteById(inserted[0]);
	} catch (error) {
		return mapFavoriteRow({
			id_favorite: inserted[0],
			id_user,
			id_product,
			name: product.name,
			description: product.description,
			price: product.price,
			image: '',
		});
	}
};

const removeFavorite = async ({ id_user, id_product, id_favorite }) => {
	const query = knex('user_favorites').where({ id_user, status: generalConstants.STATUS_ACTIVE });

	if (id_favorite) {
		query.andWhere({ id_favorite });
	} else if (id_product) {
		query.andWhere({ id_product });
	} else {
		throw new Error('Debe indicar el producto o favorito a eliminar');
	}

	const favorite = await query.first();

	if (!favorite) {
		throw new Error('El favorito no existe o ya fue eliminado');
	}

	await knex('user_favorites')
		.where({ id_favorite: favorite.id_favorite })
		.update({
			status: generalConstants.STATUS_INACTIVE,
			updated_at: knex.fn.now(),
		});

	return { id_favorite: favorite.id_favorite, id_product: favorite.id_product };
};

const isProductFavorite = async (id_user, id_product) => {
	const favorite = await knex('user_favorites')
		.where({
			id_user,
			id_product,
			status: generalConstants.STATUS_ACTIVE,
		})
		.first();

	return !!favorite;
};

module.exports = {
	getFavoritesByUser,
	addFavorite,
	removeFavorite,
	isProductFavorite,
	getFavoriteById,
};
