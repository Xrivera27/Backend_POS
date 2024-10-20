const express = require('express');
const router = express.Router();
const { getSucursales, getSucursalesbyUsuario, patchSucursal, postSucursal, desactivarSucursal } = require('../controllers/sucursalesControllers.js');

// Ruta para obtener las categorías
router.get('/', getSucursales);
router.get('/usuario/:id_usuario', getSucursalesbyUsuario);
router.patch('/actualizar-sucursal/:id_sucursal', patchSucursal);
router.patch('/desactivar-sucursal/:id_sucursal', desactivarSucursal);
router.post('/crear-sucursal/:id_usuario/:id_empresa', postSucursal);

module.exports = router;