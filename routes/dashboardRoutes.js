const express = require('express');
const router = express.Router();
const { getVentasEmpresa, getComprasPendientes, getClientesEmpresa, getAlertasPromocion } = require('../controllers/dashboardController.js');

router.get('/ventas/:id_usuario', getVentasEmpresa);
router.get('/compras-pendientes', getComprasPendientes);
router.get('/clientes/:id_usuario', getClientesEmpresa);
router.get('/alertas-promocion/:id_usuario', getAlertasPromocion);

module.exports = router;
