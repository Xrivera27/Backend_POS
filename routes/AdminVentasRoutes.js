const express = require('express');
const router = express.Router();
const { obtenerVentas, obtenerDetalleVenta, generarFactura } = require('../controllers/AdminVentasController');

const authMiddleware = require('../middlewares/loginMiddleware');

// Rutas para ventas
router.get('/ventas', authMiddleware, obtenerVentas);
// Poner la ruta específica antes de la ruta con parámetros
router.get('/ventas/factura/:id_venta/:id_usuario',  generarFactura);
router.get('/ventas/:id_venta', authMiddleware, obtenerDetalleVenta);

module.exports = router;