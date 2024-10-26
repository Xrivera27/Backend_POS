// routes/sucursalesRoutes.js

const express = require('express');
const router = express.Router();
const { getProductosOfInventory, postProducto } = require('../controllers/productoController');

router.get('/:id_usuario', getProductosOfInventory);
router.post('/crear', postProducto);
// router.put('/:id', sucursaleController.updateSucursal);
// router.delete('/:id', sucursaleController.deleteSucursal);

module.exports = router;