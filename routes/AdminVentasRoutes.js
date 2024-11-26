const express = require('express');
const router = express.Router();
const { obtenerVentas, obtenerDetalleVenta } = require('../controllers/AdminVentasController');
const authMiddleware = require('../middlewares/loginMiddleware');

// Rutas para ventas
router.get('/ventas', authMiddleware, obtenerVentas);
router.get('/ventas/:id_venta', authMiddleware, obtenerDetalleVenta);

module.exports = router;