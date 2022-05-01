const knex  = require("../db/knex");
const constants = require("../constants/constants")

const getLocationsByCompanyId = async ({company_id}) => {
    return await knex.select()
    .from('location')
    .where({
        id_company: company_id,
        status: constants.STATUS_ACTIVE
    })
    .orderBy('created_at','desc')
};
const getLocationsByCompanyIdAndName = async ({company_id, name_location, isCreate}) => {
  const query = {
    id_company: company_id,
    status: constants.STATUS_ACTIVE
  }
  if (isCreate) {
    query.name_location = name_location;
  }
  return await knex.select()
  .from('location')
  .where(query)
  .orderBy('created_at','desc')
};
const createLocation = async (location) => {
    const locationId = await knex('location').insert(location)
    return await knex('location').where({
      id_location: locationId
    })
};
const updateLocation = async (location , trx) => {
    location.updated_at=knex.fn.now()
      await (trx || knex)('location')
      .where({ id_location: location.id_location })
      .update(location);
      return location;
}
const deleteLocation= async(id_location, trx) =>{
  await (trx || knex)('location')
  .where({ id_location })
  .update({ 
      status:constants.STATUS_INACTIVE,
      updated_at:knex.fn.now()
    });
  return await knex.select()
  .from('location')
  .where({
      id_location,
  });
}
const validateLocationData = async ({body, isCreate = true}) => {
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
  if (Object.keys(validationObject).length > 0) {
    return {
        validationObject,
        errorMessage
      };
  }
  const locationDb = await getLocationsByCompanyIdAndName({
    company_id: body.id_company,
    name_location: body.name_location,
    isCreate
  })
  if(locationDb && locationDb.length > 0){
      if (isCreate) {
        errorMessage= `La localización ${body.name_location} ya existe en nuestros registros`;
      }
  }else {
    if (!isCreate) {
      errorMessage= `La localización ${body.name_location}  no existe en nuestros registros`;
    }
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
    created_at: new Date(Date.now()),
  };
  const createdLocation = await createLocation(locationToDb);
  return createdLocation;
}
const updateLocationLogic = async (location, location_id) => {
  const locationToDb = {
    ...location,
    status: constants.STATUS_ACTIVE,
    id_location:location_id,
    updated_at: new Date(Date.now()),
  };
  const updatedLocation = await updateLocation(locationToDb);
  delete updatedLocation.updated_at;
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
