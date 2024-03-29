//Import necessary libraries
const generalConstants = require('../constants/constants')
const knex = require('../db/knex')

const putProductsUpdate = async ({ body }, trx) => {

    await (trx || knex)('produtcs')
        .where('id_products', '=', body.id_products)
        .update(
            {
                name: body.name,
                description: body.description,
                price:body.price,
                discount:body.discount,
                updated_at: knex.fn.now()
            });

    return await getProductsByProductId( body.id_products);

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
    .select('p.id_products','p.cod_products','p.name','p.description', 'cat.id_category', 'p.price')
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

const postCreateProducts = async (id_cod_catalog, cod_products, name, description, price, discount, external_product_id) => {

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
            external_product_id
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


    const createdProduct = await postCreateProducts(id_cod_catalog, cod_products, name, description, price, discount, external_product_id);

    if (Object.entries(createdProduct).length > 0) {

        const id_products = createdProduct.id_products;
        const createdFeature = await postCreateFeacture(id_products, id_category, id_cod_catalog);

    }

    return createdProduct

};

const getRandomProducts = async() => {
    return await knex.select()
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
    RegistraProductModel,
    putProductsUpdate,
    getRandomProducts,
    getListImagesByProductId,
    getAllProducts
}