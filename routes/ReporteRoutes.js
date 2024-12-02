// routes/reporteVentas.routes.js
const express = require('express');
const router = express.Router();
const {reporteVentasController, getProductosOfInventorySucursal, getUsuarioOfSucursal }= require('../controllers/ReportesController');
const authMiddleware = require('../middlewares/loginMiddleware');

router.get('/reporte', authMiddleware, reporteVentasController.getReporteVentas);
router.get('/productos/:id_usuario', getProductosOfInventorySucursal);
router.get('/empleados/:id_usuario', getUsuarioOfSucursal);
router.get('/clientes', authMiddleware, reporteVentasController.getClientes);
router.get('/sucursales', authMiddleware, reporteVentasController.getSucursales);
router.get('/empleados', authMiddleware, reporteVentasController.getEmpleados);

module.exports = router;