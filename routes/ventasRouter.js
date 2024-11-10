const express = require('express');
const router = express.Router();

const { getPrePage, getProductPage, verificarRtn, selectProductoCodigo, postVenta, pagarFacturaEfectivo, eliminarProductoVenta } = require('../controllers/ventasController');

// Ruta para obtener información del usuario logueado (requiere token)
router.get('/:id_usuario', getPrePage);
router.get('/detalles/:id_usuario', getProductPage);
router.get('/buscar-cliente/:rtn', verificarRtn);
router.post('/confirmar/:id_usuario', postVenta);
router.patch('/buscar-producto/:id_usuario', selectProductoCodigo);
router.patch('/eliminar-producto/:id_usuario', eliminarProductoVenta);
router.patch('/pagar-efectivo', pagarFacturaEfectivo);

module.exports = router;
