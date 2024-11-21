const express = require('express');
const router = express.Router();

const { getPrePage, 
    getProductPage,
    getVentaPendiente,
    verificarRtn, 
    selectProductoCodigo, 
    guardarVenta, 
    getVentasGuardadas, 
    recuperarVentaGuardada, 
    postVenta,
    eliminarVenta,
    pagarFacturaEfectivo, 
    eliminarProductoVenta,
    cajaAbiertaUsuario,
    crearCajaUsuario,
    cerrarCajaUsuario
} = require('../controllers/ventasController');

// Ruta para obtener información del usuario logueado (requiere token)
router.get('/:id_usuario', getPrePage);
router.get('/detalles/:id_usuario', getProductPage);
router.get('/venta-pendiente/:id_usuario', getVentaPendiente);
router.get('/buscar-cliente/:rtn', verificarRtn);
router.get('/mostrar-ventas/:id_usuario', getVentasGuardadas);
router.get('/rec-venta/:id_compra_guardada', recuperarVentaGuardada);
router.get('/existencia-caja/:id_usuario', cajaAbiertaUsuario);
router.post('/confirmar/:id_usuario', postVenta);
router.post('/guardar-venta/:id_usuario', guardarVenta);
router.post('/crear-caja', crearCajaUsuario);
router.patch('/buscar-producto/:id_usuario', selectProductoCodigo);
router.patch('/cerrar-caja', cerrarCajaUsuario);
router.patch('/eliminar-producto/:id_usuario', eliminarProductoVenta);
router.patch('/pagar-efectivo', pagarFacturaEfectivo);
router.delete('/eliminar-venta/:id_venta/:id_factura', eliminarVenta);

module.exports = router;
