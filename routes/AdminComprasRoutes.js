const express = require('express');
const router = express.Router();
const { 
    obtenerCompras, 
    obtenerDetalleCompra, 
    registrarCompra,
    generarReporteCompras,
    actualizarEstadoCompra
} = require('../controllers/AdminComprasController');

const authMiddleware = require('../middlewares/loginMiddleware');

// Rutas para compras
router.get('/compras', authMiddleware, obtenerCompras);
router.get('/compras/:id_compra', authMiddleware, obtenerDetalleCompra);
router.post('/compras', authMiddleware, registrarCompra);
router.get('/compras/reporte', authMiddleware, generarReporteCompras);
router.put('/compras/:id_compra/estado', authMiddleware, actualizarEstadoCompra);

module.exports = router;