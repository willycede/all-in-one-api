//Import necessary libraries
const generalConstants = require('../constants/constants')
const knex = require('../db/knex')

const getCategoriesByCompanyId = async({id_company})=>{
    return await knex.select()
    .from('category')
    .where({id_company, status: generalConstants.STATUS_ACTIVE})
    .orderBy('name','asc')
}

const getCategoryByCompanyIdAndName = async({id_company, name, isCreate})=>{
    const query = {
        id_company,
        status: generalConstants.STATUS_ACTIVE
    }
    if (isCreate) {
        query.name = name;
    }
    return await knex.select()
    .from('category')
    .where(query)
    .orderBy('created_at','desc')
}

const createCategory = async (category) => {
    const idCategory = await knex('category').insert(category)
    return await knex('category').where({
        id_category: idCategory
    })
};
const updateCategory = async (category , trx) => {
    category.updated_at=knex.fn.now();
      await (trx || knex)('category')
      .where({ id_category: category.id_category })
      .update(category);
      return category;
}
const deleteCategory = async(id_category, trx) =>{
  await (trx || knex)('category')
  .where({ id_category })
  .update({ 
        status:generalConstants.STATUS_INACTIVE,
        updated_at:knex.fn.now()
    });
  return await knex.select()
  .from('category')
  .where({
        id_category,
  });
}
const validateCategoryData = async ({body, isCreate = true}) => {
  let validationObject ={};
  let errorMessage = "";
  if(!body.id_company){
    validationObject.id_company = "El id de compañia es requerido y no puede ser vacio o nulo";
  }
  if(!body.name){
    validationObject.name = "El nombre de categoría es requerido y no puede ser vacio o nulo";
  }
  const categoryDb = await getCategoryByCompanyIdAndName({
    id_company: body.id_company,
    name: body.name,
    isCreate
  })
  if(categoryDb && categoryDb.length > 0){
      if (isCreate) {
        errorMessage= `La categoría ${body.name} ya existe en nuestros registros`;
      }
  }else {
    if (!isCreate) {
      errorMessage= `La categoría ${body.name}  no existe en nuestros registros`;
    }
  }
  return {
    validationObject,
    errorMessage
  };

}
const createCategoryLogic = async (category) => {
  const categoryToDb = {
    ...category,
    status: generalConstants.STATUS_ACTIVE,
    created_at: new Date(Date.now()),
  };
  const createdCategory = await createCategory(categoryToDb);
  return createdCategory;
}
const updateCategoryLogic = async (category, id_category) => {
  const categoryToDb = {
    ...category,
    status: generalConstants.STATUS_ACTIVE,
    id_category,
    updated_at: new Date(Date.now()),
  };
  const updatedCategory = await updateCategory(categoryToDb);
  delete updatedCategory.updated_at;
  return updatedCategory;
}

module.exports = {
    getCategoriesByCompanyId,
    updateCategoryLogic,
    createCategoryLogic,
    validateCategoryData,
    deleteCategory,
    updateCategory,
    createCategory,
    getCategoryByCompanyIdAndName,
    getCategoriesByCompanyId,
}