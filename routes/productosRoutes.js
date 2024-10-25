// routes/sucursalesRoutes.js

const express = require('express');
const router = express.Router();
const { getProductosOfInventory } = require('../controllers/productoController');

router.get('/:id_usuario', getProductosOfInventory);
// router.post('/', sucursaleController.createSucursal);
// router.put('/:id', sucursaleController.updateSucursal);
// router.delete('/:id', sucursaleController.deleteSucursal);

module.exports = router;