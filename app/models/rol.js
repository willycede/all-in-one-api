const constants = require("../constants/constants");

const generalConstants = require('../constants/constants')
const utils = require('../utils/globalFunctions')
const knex = require('../db/knex')


const createRol = async (name, description,status) => {
   

    const result = await knex('rol').insert(
        {
            name,
            description,
            status
        }
    )
    return await knex('rol').where({
        id_rol: result[0]
    })

};

const getRol = async () => {
    return await knex.select()
        .from('rol')
        .where({ status: generalConstants.STATUS_ACTIVE })
        .orderBy('id_rol', 'asc')
};

const getRolById = async (id_rol) => {
    return await knex.select()
        .from('rol')
        .where({ id_rol: id_rol });
};

const deleteRol = async({id_rol}, trx) =>{

    await (trx || knex)('rol')
    .where('id_rol', '=', id_rol)
    .update({ 
        status:constants.STATUS_INACTIVE
     });
  
     return await getRolById(id_rol);
  
  };

const putRolUpdate = async ({body}, trx) => {

await (trx || knex)('rol')
.where('id_rol', '=', body.id_rol)
.update(
    {
    name:body.name,
    description:body.description
    });

return await getRolById(body.id_rol);

};


module.exports = {
    createRol,getRol,deleteRol,putRolUpdate,
}