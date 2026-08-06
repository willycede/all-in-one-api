//Import necessary libraries
const generalConstants = require('../constants/constants')
const knex = require('../db/knex')
const productModifiersModel = require('./productModifiers')
const {
	parseFilterParams,
	applyPriceFilters,
	applyCityFilter,
	applySort,
} = require('../helpers/productCatalogFilters')

const DEFAULT_LIMIT = 12;
const ALLOWED_LIMITS = [12, 24, 48];

const normalizePagination = (page, limit) => {
	const safePage = Math.max(1, parseInt(page, 10) || 1);
	const parsedLimit = parseInt(limit, 10);
	const safeLimit = ALLOWED_LIMITS.includes(parsedLimit) ? parsedLimit : DEFAULT_LIMIT;
	return { page: safePage, limit: safeLimit };
};

const buildProductsBaseQuery = (categoryId, searchBy, filters) => {
	let query = knex('products as p').where('p.status', generalConstants.STATUS_ACTIVE);

	const hasGeneralCategory = categoryId && categoryId !== 'undefined';
	if (hasGeneralCategory || filters.subcategoryId) {
		query = query
			.leftJoin('features as f', 'f.id_products', 'p.id_products')
			.join('category as cat', 'cat.id_category', 'f.id_category');

		if (hasGeneralCategory) {
			query = query.where('cat.id_general_category', parseInt(categoryId, 10));
		}
		if (filters.subcategoryId) {
			query = query.where(function categoryScope() {
				this.where('cat.id_category', filters.subcategoryId)
					.orWhere('cat.id_parent_category', filters.subcategoryId);
			});
		}
	}

	if (searchBy && String(searchBy).trim()) {
		query = query.where('p.name', 'like', `%${String(searchBy).trim()}%`);
	}

	query = applyPriceFilters(query, filters);
	query = applyCityFilter(query, filters.cityId);

	return query;
};

const getProductsPaginated = async ({ categoryId, subcategoryId, searchBy, page, limit, minPrice, maxPrice, cityId, sortBy }) => {
	const { page: safePage, limit: safeLimit } = normalizePagination(page, limit);
	const offset = (safePage - 1) * safeLimit;
	const filters = parseFilterParams({ minPrice, maxPrice, cityId, sortBy, subcategoryId });
	const baseQuery = buildProductsBaseQuery(categoryId, searchBy, filters);

	const countSubquery = baseQuery.clone()
		.select('p.id_products')
		.groupBy('p.id_products');

	const countResult = await knex
		.count({ total: 'id_products' })
		.from(countSubquery.as('sub'))
		.first();

	const total = Number((countResult && countResult.total) || 0);
	const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

	let itemsQuery = baseQuery
		.clone()
		.select(
			'p.id_products',
			'p.cod_products',
			'p.name',
			'p.description',
			'p.price',
			'p.required_documents',
			'p.allowed_cities',
			knex.raw('(select count(*) from product_modifiers pm where pm.id_products = p.id_products and pm.status = ?) as modifiers_count', [generalConstants.STATUS_ACTIVE])
		)
		.groupBy(
			'p.id_products',
			'p.cod_products',
			'p.name',
			'p.description',
			'p.price',
			'p.required_documents',
			'p.allowed_cities'
		);

	itemsQuery = applySort(itemsQuery, filters.sortBy);

	const items = await itemsQuery
		.limit(safeLimit)
		.offset(offset);

	return {
		items,
		pagination: {
			page: safePage,
			limit: safeLimit,
			total,
			totalPages,
			hasNextPage: safePage < totalPages,
			hasPrevPage: safePage > 1,
		},
		filters,
	};
};

const getProductFeature = async (id_products) => {
	return knex('features')
		.where({ id_products, status: generalConstants.STATUS_ACTIVE })
		.first();
};

const getProductEditData = async (id_products) => {
	const rows = await getProductsByProductId(id_products);
	if (!rows || rows.length === 0) {
		return null;
	}
	const product = rows[0];
	const feature = await getProductFeature(id_products);
	product.id_category = feature ? feature.id_category : null;
	product.images = await getListImagesByProductId(id_products);
	product.modifiers = await productModifiersModel.getModifiersByProductId(id_products);
	return product;
};

const normalizeAllowedCities = (value) => {
	if (Array.isArray(value)) {
		const cityIds = value
			.map((id) => parseInt(id, 10))
			.filter((id) => Number.isFinite(id) && id > 0);
		return cityIds.length > 0 ? cityIds.join(',') : null;
	}
	if (typeof value === 'string') {
		return value.trim() || null;
	}
	return null;
};

const validateLeafCategory = async (idCategory) => {
	if (!idCategory) {
		return 'La categoría del producto es obligatoria';
	}
	const category = await knex('category')
		.where({
			id_category: idCategory,
			status: generalConstants.STATUS_ACTIVE,
		})
		.first();
	if (!category) {
		return 'La categoría seleccionada no existe o está inactiva';
	}
	const child = await knex('category')
		.where({
			id_parent_category: idCategory,
			status: generalConstants.STATUS_ACTIVE,
		})
		.first();
	return child ? 'Selecciona una categoría final, no una categoría agrupadora' : '';
};

const validateUpdateProduct = async ({ body }) => {
	let validationObject = {};
	let errorMessage = '';

	if (!body.id_products) {
		validationObject.id_products = 'El id del producto es obligatorio';
	}
	if (!body.name) {
		validationObject.name = 'El nombre del producto es obligatorio';
	}
	if (!body.cod_products) {
		validationObject.cod_products = 'El código del producto es obligatorio';
	}
	if (body.price <= 0) {
		validationObject.price = 'El precio debe ser mayor a 0';
	}
	if (body.discount >= body.price) {
		validationObject.discount = 'El descuento no puede ser mayor o igual al precio';
	}
	const categoryError = await validateLeafCategory(body.id_category);
	if (categoryError) {
		validationObject.id_category = categoryError;
	}

	if (body.cod_products && body.id_products) {
		const duplicate = await knex('products')
			.where({ cod_products: body.cod_products, status: generalConstants.STATUS_ACTIVE })
			.whereNot({ id_products: body.id_products })
			.first();
		if (duplicate) {
			errorMessage = `El código ${duplicate.cod_products} ya está en uso por otro producto`;
			validationObject.cod_products = errorMessage;
		}
	}

	return { validationObject, errorMessage };
};

const putProductsUpdate = async ({ body }, trx) => {
	const db = trx || knex;

	const productUpdate = {
		name: body.name,
		cod_products: body.cod_products,
		description: body.description,
		price: body.price,
		discount: body.discount,
		id_cod_catalog: body.id_cod_catalog,
		external_product_id: body.external_product_id || null,
		updated_at: knex.fn.now(),
	};

	if (body.allowed_cities !== undefined) {
		productUpdate.allowed_cities = normalizeAllowedCities(body.allowed_cities);
	}

	await db('products')
		.where('id_products', '=', body.id_products)
		.update(productUpdate);

	if (Array.isArray(body.modifiers)) {
		await productModifiersModel.replaceProductModifiers(body.id_products, body.modifiers);
	}

	if (body.id_category) {
		const feature = await getProductFeature(body.id_products);
		if (feature) {
			const featureUpdate = {
				id_category: body.id_category,
				id_catalogo: body.id_cod_catalog,
			};
			await db('features')
				.where({ id_products: body.id_products, status: generalConstants.STATUS_ACTIVE })
				.update(featureUpdate);
		} else {
			await postCreateFeacture(body.id_products, body.id_category, body.id_cod_catalog);
		}
	}

	return getProductEditData(body.id_products);
};

const addProductImage = async (productId, url, name, order) => {
	const result = await knex('product_images').insert({
		product_id: productId,
		url,
		name: name || 'image',
		order: order || 0,
		status: generalConstants.STATUS_ACTIVE,
	});
	return knex('product_images').where({ product_images_id: result[0] }).first();
};

const deleteProductImage = async (imageId, productId) => {
	const image = await knex('product_images')
		.where({ product_images_id: imageId, product_id: productId, status: generalConstants.STATUS_ACTIVE })
		.first();
	if (!image) {
		return null;
	}
	await knex('product_images')
		.where({ product_images_id: imageId })
		.update({ status: generalConstants.STATUS_INACTIVE });
	return image;
};

const getProductImageById = async (imageId, productId) => {
	return knex('product_images')
		.where({
			product_images_id: imageId,
			product_id: productId,
			status: generalConstants.STATUS_ACTIVE,
		})
		.first();
};

const getAllProducts = async () => {
    const queryToSearch ={
        'status':generalConstants.STATUS_ACTIVE
    }
    const queryToExcecute = knex('products')
        .where(queryToSearch);
    return await queryToExcecute.orderBy('name', 'asc');
}

const getProductsByGeneralCategoryId = async (category_id) => {

    const queryToExcecute = knex('products as p')
    .leftJoin('features as f', 'f.id_products', 'p.id_products')
    .join('category as cat', 'cat.id_category', 'f.id_category')
    .select('p.id_products','p.cod_products','p.name','p.description', 'cat.id_category', 'p.price', 'p.required_documents')
    .where({ 'cat.id_general_category':category_id});
    return await queryToExcecute.orderBy('p.name', 'asc');
}

/*
const getProductsByCategoryId = async (category_id) => {
    return await knex('produtcs as p')
        .join('features as f', 'f.id_products', 'p.id_products')
        .join('category as cat', 'cat.id_category', 'f.id_category')
        .select('p.id_products','p.cod_products','p.name','p.description', 'cat.id_category', 'cat.name')
        .where({ 'cat.id_category':category_id})
        .orderBy('cat.name', 'asc');
}
*/
const getProductsByProductId = async (id_products) => {
    return await knex.select()
        .from('products')
        .where({ id_products: id_products, status: generalConstants.STATUS_ACTIVE })
        .orderBy('name', 'asc')
}

const getProductsByCodProduct = async (cod_products) => {
    return await knex.select()
        .from('products')
        .where({ cod_products: cod_products, status: generalConstants.STATUS_ACTIVE })
        .orderBy('name', 'asc')
        .first()
}

const postCreateFeacture = async (id_products, id_category, id_catalogo) => {

    const result = await knex('features').insert(
        {
            id_products,
            id_category,
            id_catalogo,
            status: generalConstants.STATUS_ACTIVE,
            created_at: knex.fn.now()
        }
    )

    //console.log(result);

    return await knex('features').where({
        id_products: id_products
    }).first()

};

const postCreateProducts = async (id_cod_catalog, cod_products, name, description, price, discount, external_product_id, allowed_cities) => {

    const result = await knex('products').insert(
        {
            id_cod_catalog,
            cod_products,
            name,
            description,
            price,
            discount,
            status: generalConstants.STATUS_ACTIVE,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
            external_product_id,
            allowed_cities: normalizeAllowedCities(allowed_cities)
        }
    )

    return await knex('products').where({
        id_products: result[0]
    }).first()
};

const validateExistProduct = async ({
    body
}) => {

    
    console.log(body);

    let validationObject = {};
    let errorMessage = "";

    if (!body.id_cod_catalog) {
        validationObject.name = "El codigo de catalogo es obligatorio";
    }

    if (!body.name) {
        validationObject.description = "El nombre del producto es obligatorio";
    }

    if (body.price <= 0) {
        validationObject.description = "El precio no puede ser cero 0 menor a 0";
    }

    if (body.discount >= body.price) {
        validationObject.description = "El descuento no puede ser mayor o igual al precio";
    }
    const categoryError = await validateLeafCategory(body.id_category);
    if (categoryError) {
        validationObject.id_category = categoryError;
    }

    const ValidaRegistroProduct = await getProductsByCodProduct(body.cod_products);

    if (ValidaRegistroProduct) {
        errorMessage = `El codigo de producto : ( ${ValidaRegistroProduct.cod_products} ) ya se encuentra  en uso para el producto : ${ValidaRegistroProduct.name}, por favor verificar`
        validationObject.id_users = "El codigo del producto ya se encuentra registrado";
    }

    return {
        validationObject,
        errorMessage
    };

};

const RegistraProductModel = async ({
    body
}) => {

    const id_cod_catalog = body.id_cod_catalog;
    const cod_products = body.cod_products;
    const name = body.name;
    const description = body.description;
    const price = body.price
    const discount = body.discount
    const id_category = body.id_category
    const external_product_id = body.external_product_id
    const allowed_cities = body.allowed_cities


    const createdProduct = await postCreateProducts(id_cod_catalog, cod_products, name, description, price, discount, external_product_id, allowed_cities);

    if (Object.entries(createdProduct).length > 0) {

        const id_products = createdProduct.id_products;
        const createdFeature = await postCreateFeacture(id_products, id_category, id_cod_catalog);

        if (Array.isArray(body.modifiers)) {
            createdProduct.modifiers = await productModifiersModel.replaceProductModifiers(id_products, body.modifiers);
        }

    }

    return createdProduct

};

const getRandomProducts = async() => {
    return await knex.select(
        'products.*',
        knex.raw('(select count(*) from product_modifiers pm where pm.id_products = products.id_products and pm.status = ?) as modifiers_count', [generalConstants.STATUS_ACTIVE])
    )
    .from('products')
    .where({status: generalConstants.STATUS_ACTIVE})
    .limit(10)
    .orderByRaw('RAND()');
}

const getListImagesByProductId = async(productId) => {
    return await knex.select()
    .from('product_images')
    .where({
        product_id: productId,
        status: generalConstants.STATUS_ACTIVE
    });
}


module.exports = {
    getProductsByGeneralCategoryId,
    getProductsByProductId,
    postCreateProducts,
    postCreateFeacture,
    getProductsByCodProduct,
    validateExistProduct,
    validateUpdateProduct,
    RegistraProductModel,
    putProductsUpdate,
    getRandomProducts,
    getListImagesByProductId,
    getProductEditData,
    addProductImage,
    deleteProductImage,
    getProductImageById,
    getAllProducts,
    getProductsPaginated,
    DEFAULT_LIMIT,
    ALLOWED_LIMITS,
}