// routes/sucursalesRoutes.js

const express = require('express');
const router = express.Router();
const { getProductosOfInventory, postProducto, patchProducto } = require('../controllers/productoController');

router.get('/:id_usuario', getProductosOfInventory);
router.post('/crear', postProducto);
router.patch('/actualizar/:id_producto', patchProducto);
// router.delete('/:id', sucursaleController.deleteSucursal);

module.exports = router;