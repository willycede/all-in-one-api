const knex  = require("../db/knex");
const constants = require("../constants/constants")

const getLocationsByCompanyId = async ({company_id}) => {
    return await knex.select()
    .from('locations')
    .where({
        company_id,
        state: constants.STATUS_ACTIVE
    })
    .orderBy('created_at','desc')
};
const createLocation = async ({location}) => {
    const locationId = await knex('locations').insert(location)
    return await knex('locations').where({
      id_location: locationId
    })
};
const updateLocation = async ({ location }, trx) => {
    location.updated_at=knex.fn.now()
      await (trx || knex)('locations')
      .where({ id_location: location.id_location })
      .update(location);
      return location;
}
  const deleteLocation= async({id_location}, trx) =>{
    await (trx || knex)('locations')
    .where({ id_location })
    .update({ 
        status:constants.STATUS_INACTIVE,
        deleted_at:knex.fn.now()
     });
    return ;
  }
module.exports = {
    getLocationsByCompanyId,
    createLocation,
    updateLocation,
    deleteLocation,
}
