const express = require('express');
const router = express.Router();
const { getSucursales, getSucursalesbyUsuario, patchSucursal, postSucursal, desactivarSucursal, getSucursalesbyUsuarioSummary } = require('../controllers/sucursalesControllers.js');

// Ruta para obtener las categorías
router.get('/', getSucursales);
router.get('/empresa/:id_usuario', getSucursalesbyUsuario);
router.get('/info-summ/:id_usuario', getSucursalesbyUsuarioSummary);
router.patch('/actualizar-sucursal/:id_sucursal', patchSucursal);
router.patch('/desactivar-sucursal/:id_sucursal', desactivarSucursal);
router.post('/crear-sucursal/:id_usuario/', postSucursal);

module.exports = router;