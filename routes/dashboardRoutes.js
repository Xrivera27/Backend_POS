const express = require('express');
const router = express.Router();
const { getVentasEmpresa, getAlertasPorPromocionProducto, getClientesEmpresa, getAlertasPromocion, getVentasUltimosTresMeses, getCategoriasPopulares } = require('../controllers/dashboardController.js');

router.get('/ventas/:id_usuario', getVentasEmpresa);
router.get('/promocion-producto/:id_usuario', getAlertasPorPromocionProducto);
router.get('/clientes/:id_usuario', getClientesEmpresa);
router.get('/alertas-promocion/:id_usuario', getAlertasPromocion);
router.get('/ventas/ultimos-tres-meses/:id_usuario', getVentasUltimosTresMeses);
router.get('/categorias/mas-vendidas/:id_usuario', getCategoriasPopulares);

module.exports = router;
