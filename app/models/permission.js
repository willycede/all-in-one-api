const knex  = require("../db/knex");
const constants = require("../constants/constants")

const getPermissionsByRolId = async ({id_rol}) => {
    return await knex.select()
    .from('permissions')
    .where({
        id_rol,
        status: constants.STATUS_ACTIVE
    })
    .orderBy('created_at','desc')
};

const createPermission = async (permission) => {
    const permissionId = await knex('permissions').insert(permission)
    return await knex('permissions').where({
        id_permissions: permissionId
    })
};
const updatePermission = async (permission , trx) => {
      permission.updated_at=knex.fn.now();
      await (trx || knex)('permissions')
      .where({ id_permissions: permission.id_permissions })
      .update(permission);
      return permission;
}
const deletePermission= async(id_permissions, trx) =>{
  await (trx || knex)('permissions')
  .where({ id_permissions })
  .update({ 
      status:constants.STATUS_INACTIVE,
      updated_at:knex.fn.now()
    });
  return await knex.select()
  .from('permissions')
  .where({
    id_permissions,
  });
}
const validatePermissionData = async ({body, isCreate = true}) => {
  let validationObject ={};
  let errorMessage = "";
  if(!body.id_rol){
    validationObject.id_rol = "El id del rol es requerido y no puede ser vacio o nulo";
  }
  if (Object.keys(validationObject).length > 0) {
    return {
        validationObject,
        errorMessage
      };
  }
  const permissionDb = await getPermissionsByRolId({
    id_rol: body.id_rol
  })
  if(permissionDb && permissionDb.length > 0){
      if (isCreate) {
        errorMessage= `El permiso ya existe en nuestros registros`;
      }
  }else {
    if (!isCreate) {
      errorMessage= `El permiso no existe en nuestros registros`;
    }
  }
  return {
    validationObject,
    errorMessage
  };

}
const createPermissionLogic = async (permission) => {
  const permissionToDb = {
    ...permission,
    status: constants.STATUS_ACTIVE,
    created_at: new Date(Date.now()),
  };
  const createdPermission = await createPermission(permissionToDb);
  return createdPermission;
}
const updatePermissionLogic = async (permission, id_permission) => {
  const permissionToDb = {
    ...permission,
    status: constants.STATUS_ACTIVE,
    updated_at: new Date(Date.now()),
    id_permissions: id_permission,
  };
  const updatedPermission = await updatePermission(permissionToDb);
  delete updatedPermission.updated_at;
  return await knex('permissions').where({
    id_permissions: id_permission
  })
}
module.exports = {
    getPermissionsByRolId,
    createPermission,
    updatePermission,
    deletePermission,
    validatePermissionData,
    createPermissionLogic,
    updatePermissionLogic
}
