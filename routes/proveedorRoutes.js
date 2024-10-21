const express = require('express');
const router = express.Router();
const { getProveedores , getProveedoresbyUsuario , postProveedor, patchProveedor,  desactivarProveedor } = require('../controllers/proveedorController.js');

// Ruta para obtener las categorías
router.get('/', getProveedores);
router.get('/:id_usuario', getProveedoresbyUsuario);
router.post('/crear-proveedor/:id_usuario/', postProveedor);
router.patch('/actualizar-proveedor/:id_proveedor', patchProveedor);
router.patch('/desactivar-proveedor/:id_proveedor', desactivarProveedor);

module.exports = router;