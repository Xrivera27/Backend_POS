const express = require('express');
const router = express.Router();
const { obtenerVentasCeo, obtenerVentas, obtenerDetalleVenta, generarFactura, cancelarVenta, generarReporteCancelacion, obtenerReporteCancelacion } = require('../controllers/AdminVentasController');

const authMiddleware = require('../middlewares/loginMiddleware');

// Rutas para ventas
router.get('/ventas', authMiddleware, obtenerVentas);
router.get('/ventas-ceo/:id_sucursal', obtenerVentasCeo);
// Poner la ruta específica antes de la ruta con parámetros
router.get('/ventas/factura/:id_venta/:id_usuario',  generarFactura);
router.get('/ventas/:id_venta', authMiddleware, obtenerDetalleVenta);

router.get('/ventas/:id_venta/reporte-cancelacion', authMiddleware, generarReporteCancelacion);

router.post('/ventas/:id_venta/cancel', authMiddleware, cancelarVenta);
router.get('/ventas/:id_venta/reporte-cancelacion', authMiddleware, obtenerReporteCancelacion);

module.exports = router;