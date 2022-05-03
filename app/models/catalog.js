const knex  = require("../db/knex");
const constants = require("../constants/constants")

const getCatalogs = async () => {
  return await knex.select()
  .from('catalog')
  .where({
      status: constants.STATUS_ACTIVE
  })
  .orderBy('created_at','desc')
};

const getCatalogsById = async ({id_catalog}) => {
    return await knex.select()
    .from('catalog')
    .where({
        id_catalog,
        status: constants.STATUS_ACTIVE
    })
    .orderBy('created_at','desc')
};
const getCatalogByName = async ({name_catalog, isCreate}) => {
    const query = {
      status: constants.STATUS_ACTIVE
    }
    if (isCreate) {
      query.name_catalog = name_catalog;
    }
    return await knex.select()
    .from('catalog')
    .where(query)
    .orderBy('created_at','desc')
  };
const createCatalog = async (catalog) => {
    const catalogId = await knex('catalog').insert(catalog)
    return await knex('catalog').where({
      id_catalog: catalogId
    })
};
const updateCatalog = async (catalog , trx) => {
    catalog.updated_at=knex.fn.now()
      await (trx || knex)('catalog')
      .where({ id_catalog: catalog.id_catalog })
      .update(catalog);
      return catalog;
}
const deleteCatalog= async(id_catalog, trx) =>{
  await (trx || knex)('catalog')
  .where({ id_catalog })
  .update({ 
      status:constants.STATUS_INACTIVE,
      updated_at:knex.fn.now()
    });
  return await knex.select()
  .from('catalog')
  .where({
      id_catalog,
  });
}
const validateCatalogData = async ({body, isCreate = true}) => {
  let validationObject ={};
  let errorMessage = "";
  if(!body.cod_catalog){
    validationObject.cod_catalog = "El cod_catalog es requerido y no puede ser vacio o nulo";
  }
  if(!body.id_cod_catalog){
    validationObject.id_cod_catalog = "El id_cod_catalog es requerido y no puede ser vacio o nulo";
  }
  if(!body.name_catalog){
    validationObject.name_catalog = "El name_catalog es requerido y no puede ser vacio o nulo";
  }
  if (Object.keys(validationObject).length > 0) {
    return {
        validationObject,
        errorMessage
      };
  }
  const catalogDb = await getCatalogByName({
    name_catalog: body.name_catalog,
    isCreate
  })
  if(catalogDb && catalogDb.length > 0){
      if (isCreate) {
        errorMessage= `El item de catalogo ${body.name_catalog} ya existe en nuestros registros`;
      }
  }else {
    if (!isCreate) {
      errorMessage= `El item de catalogo ${body.name_catalog}  no existe en nuestros registros`;
    }
  }
  return {
    validationObject,
    errorMessage
  };

}
const createCatalogLogic = async (catalog) => {
  const catalogToDb = {
    ...catalog,
    status: constants.STATUS_ACTIVE,
    created_at: new Date(Date.now()),
  };
  const createdCatalog = await createCatalog(catalogToDb);
  return createdCatalog;
}
const updateCatalogLogic = async (catalog, catalog_id) => {
  const catalogToDb = {
    ...catalog,
    status: constants.STATUS_ACTIVE,
    id_catalog:catalog_id,
    updated_at: new Date(Date.now()),
  };
  const updatedCatalog = await updateCatalog(catalogToDb);
  delete updatedCatalog.updated_at;
  return updatedCatalog;
}
module.exports = {
    getCatalogsById,
    createCatalog,
    updateCatalog,
    deleteCatalog,
    validateCatalogData,
    createCatalogLogic,
    updateCatalogLogic,
    getCatalogs
}
