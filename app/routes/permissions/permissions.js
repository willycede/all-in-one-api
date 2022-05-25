const express = require('express');
const router = express.Router();
const permissionController = require('../../controllers/permissionController')

router.post("/createPermission", permissionController.createPermission);
router.put("/updatePermission/:id_permission", permissionController.updatePermission);
router.delete("/deletePermission/:id_permission", permissionController.deletePermission);
router.get("/getPermissions", permissionController.getPermission);
module.exports = router;