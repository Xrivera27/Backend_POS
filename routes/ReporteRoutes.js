// routes/reporteVentas.routes.js
const express = require('express');
const router = express.Router();
const reporteVentasController = require('../controllers/ReportesController');
const authMiddleware = require('../middlewares/loginMiddleware');

router.get('/reporte', authMiddleware, reporteVentasController.getReporteVentas);
router.get('/clientes', authMiddleware, reporteVentasController.getClientes);
router.get('/sucursales', authMiddleware, reporteVentasController.getSucursales);
router.get('/empleados', authMiddleware, reporteVentasController.getEmpleados);

module.exports = router;