// routes/sucursalesRoutes.js

const express = require('express');
const router = express.Router();
const sucursaleController = require('../controllers/sucursaleController');

router.get('/', sucursaleController.getSucursales);
router.post('/', sucursaleController.createSucursal);
router.put('/:id', sucursaleController.updateSucursal);
router.delete('/:id', sucursaleController.deleteSucursal);

module.exports = router;
