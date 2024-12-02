const express = require('express');
const router = express.Router();
const { getVentasEmpresa, getComprasPendientes, getClientesEmpresa, getAlertas } = require('../controllers/dashboardController.js');

router.get('/ventas/:id_usuario', getVentasEmpresa);
router.get('/compras-pendientes', getComprasPendientes);
router.get('/clientes/:id_usuario', getClientesEmpresa);
router.get('/alertas', getAlertas);

module.exports = router;
