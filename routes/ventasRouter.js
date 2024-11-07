const express = require('express');
const router = express.Router();

const { getPrePage, getProductPage, verificarRtn, getProductobyCodigo, postVenta, pagarFacturaEfectivo } = require('../controllers/ventasController');

// Ruta para obtener información del usuario logueado (requiere token)
router.get('/:id_usuario', getPrePage);
router.get('/crear-venta/:id_usuario', getProductPage);
router.get('/buscar-cliente/:rtn', verificarRtn);
router.get('/buscar-producto/:codigo', getProductobyCodigo);
router.post('/crear-registro', postVenta);
router.patch('/pagar-efectivo', pagarFacturaEfectivo);

module.exports = router;
