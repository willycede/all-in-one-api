const knex  = require("../db/knex");
const constants = require("../constants/constants")

const getLocationsByCompanyId = async ({company_id}) => {
    return await knex.select()
    .from('location')
    .where({
        company_id,
        state: constants.STATUS_ACTIVE
    })
    .orderBy('created_at','desc')
};
const getLocationsByCompanyIdAndName = async ({company_id, name_location}) => {
  return await knex.select()
  .from('location')
  .where({
      company_id,
      name_location,
      state: constants.STATUS_ACTIVE
  })
  .orderBy('created_at','desc')
};
const createLocation = async ({location}) => {
    const locationId = await knex('location').insert(location)
    return await knex('location').where({
      id_location: locationId
    })
};
const updateLocation = async ({ location }, trx) => {
    location.updated_at=knex.fn.now()
      await (trx || knex)('location')
      .where({ id_location: location.id_location })
      .update(location);
      return location;
}
const deleteLocation= async({id_location}, trx) =>{
  await (trx || knex)('location')
  .where({ id_location })
  .update({ 
      status:constants.STATUS_INACTIVE,
      deleted_at:knex.fn.now()
    });
  return ;
}
const validateLocationData = async ({body}) => {
  let validationObject ={};
  let errorMessage = "";
  if(!body.id_company){
    validationObject.id_company = "El id de compañia es requerido y no puede ser vacio o nulo";
  }
  if(!body.name_location){
    validationObject.name_location = "El nombre de localización es requerido y no puede ser vacio o nulo";
  }
  if(!body.latitud){
    validationObject.latitud = "La latitud es requerido y no puede ser vacio o nulo";
  }
  if(!body.longitud){
    validationObject.longitud = "La longitud es requerido y no puede ser vacio o nulo";
  }
  const locationDb = await getLocationsByCompanyIdAndName({
    company_id: body.company_id,
    name_location: body.name_location
  })
  if(locationDb){
      errorMessage= `La localización ${body.name_location} ya existe en nuestros registros`;
  }
  return {
    validationObject,
    errorMessage
  };

}
const createLocationLogic = async (location) => {
  const locationToDb = {
    ...location,
    status: constants.STATUS_ACTIVE,
    createdAt: new Date(Date.now()),
  };
  const createdLocation = await createLocation(locationToDb);
  return createdLocation;
}
const updateLocationLogic = async (location, location_id) => {
  const locationToDb = {
    ...location,
    status: constants.STATUS_ACTIVE,
    id_location:location_id,
    updateddAt: new Date(Date.now()),
  };
  const updatedLocation = await updateLocation(locationToDb);
  return updatedLocation;
}
module.exports = {
    getLocationsByCompanyId,
    createLocation,
    updateLocation,
    deleteLocation,
    validateLocationData,
    getLocationsByCompanyIdAndName,
    createLocationLogic,
    updateLocationLogic
}
