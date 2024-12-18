// routes/sucursalesRoutes.js

const express = require('express');
const router = express.Router();
const { getProductosOfInventory, postProducto, patchProducto, desactivarProducto, getExtraInfoProduct, getProductosOfInventorySucursal } = require('../controllers/productoController');

router.get('/:id_usuario', getProductosOfInventory);
router.get('/info-extra/:id_producto', getExtraInfoProduct);
router.get('/producto-sucursal/:id_sucursal', getProductosOfInventorySucursal);
router.post('/crear', postProducto);
router.patch('/actualizar/:id_producto', patchProducto);
router.patch('/desactivar/:id_producto', desactivarProducto);

module.exports = router;