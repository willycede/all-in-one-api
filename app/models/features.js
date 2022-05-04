//Import necessary libraries
const generalConstants = require('../constants/constants')
const knex = require('../db/knex')

const getFeatures = async()=>{
    return await knex.select()
    .from('features')
    .where({status: generalConstants.STATUS_ACTIVE})
    .orderBy('created_at','asc')
}

const getFeatureByIds = async({id_products, id_category, id_catalogo, isCreate})=>{
    const query = {
        status: generalConstants.STATUS_ACTIVE
    }
    if (isCreate) {
        query.id_products = id_products;
        query.id_category = id_category;
        query.id_catalogo = id_catalogo;
    }
    return await knex.select()
    .from('features')
    .where(query)
    .orderBy('created_at','desc')
}

const createFeature = async (feature) => {
    const idFeature = await knex('features').insert(feature);
    return await knex('features').where({
      id_products: feature.id_products, id_category: feature.id_category, id_catalogo: feature.id_catalogo
    })
};
const updateFeature = async (feature , id_products, id_category, id_catalogo, trx) => {
  feature.updated_at=knex.fn.now();
      await (trx || knex)('features')
      .where({ id_products, id_category, id_catalogo})
      .update(feature);
      return feature;
}
const deleteFeature = async(id_products, id_category, id_catalogo, trx) =>{
  await (trx || knex)('features')
  .where({ id_products, id_category, id_catalogo })
  .update({ 
        status:generalConstants.STATUS_INACTIVE,
        updated_at:knex.fn.now()
    });
  return await knex.select()
  .from('features')
  .where({
    id_products, id_category, id_catalogo,
  });
}
const validateFeatureData = async ({body, isCreate = true}) => {
  let validationObject ={};
  let errorMessage = "";
  if(!body.id_products){
    validationObject.id_products = "El id de del producto es requerido y no puede ser vacio o nulo";
  }
  if(!body.id_category){
    validationObject.id_category = "El id de categoría es requerido y no puede ser vacio o nulo";
  }
  if(!body.id_catalogo){
    validationObject.id_catalogo = "El id de catalogo es requerido y no puede ser vacio o nulo";
  }
  if (Object.keys(validationObject).length > 0) {
    return {
        validationObject,
        errorMessage
      };
  }
  const featuresDb = await getFeatureByIds({
    id_products: body.id_products,
    id_category: body.id_products,
    id_catalogo: body.id_catalogo,
    isCreate
  })
  if(featuresDb && featuresDb.length > 0){
      if (isCreate) {
        errorMessage= `La asociación de features ya existe en nuestros registros`;
      }
  }else {
    if (!isCreate) {
      errorMessage= `La asociación de features no existe en nuestros registros`;
    }
  }
  return {
    validationObject,
    errorMessage
  };

}
const createFeatureLogic = async (feature) => {
  const featuresToDb = {
    ...feature,
    status: generalConstants.STATUS_ACTIVE,
    created_at: new Date(Date.now()),
  };
  const createdFeature = await createFeature(featuresToDb);
  return createdFeature;
}
const updateFeatureLogic = async (feature, id_products, id_category, id_catalogo) => {
  const featureToDb = {
    ...feature,
    status: generalConstants.STATUS_ACTIVE,
    updated_at: new Date(Date.now()),
  };
  const updatedFeature = await updateFeature(featureToDb, id_products, id_category, id_catalogo);
  delete updatedFeature.updated_at;
  return updatedFeature;
}

module.exports = {
    getFeatureByIds,
    updateFeature,
    createFeatureLogic,
    validateFeatureData,
    deleteFeature,
    updateFeature,
    createFeature,
    getFeatures,
    updateFeatureLogic,
}