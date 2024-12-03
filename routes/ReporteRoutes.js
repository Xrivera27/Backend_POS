// routes/reporteVentas.routes.js
const express = require('express');
const router = express.Router();
const {getCajerosReportes, getClientesReportes, getSucursalesReportes, reporteVentasController, getProductosOfInventorySucursal, getUsuarioOfSucursal }= require('../controllers/ReportesController');
const authMiddleware = require('../middlewares/loginMiddleware');

router.get('/reporte', authMiddleware, reporteVentasController.getReporteVentas);
router.get('/productos/:id_usuario', getProductosOfInventorySucursal);
router.get('/empleados/:id_usuario', getUsuarioOfSucursal);
router.get('/clientes', authMiddleware, reporteVentasController.getClientes);
router.get('/sucursales', authMiddleware, reporteVentasController.getSucursales);
router.get('/empleados', authMiddleware, reporteVentasController.getEmpleados);

//reportes
router.get('/reporte-empleados/:id_usuario/:fechaInicio/:fechaFin', getCajerosReportes);
router.get('/reporte-clientes/:id_usuario/:fechaInicio/:fechaFin', getClientesReportes);
router.get('/reporte-sucursales/:id_usuario/:fechaInicio/:fechaFin', getSucursalesReportes);

module.exports = router;