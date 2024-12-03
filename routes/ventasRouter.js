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
    pagarFacturaTransferencia,
    eliminarProductoVenta,
    cajaAbiertaUsuario,
    crearCajaUsuario,
    cerrarCajaUsuario,
    generarFactura,
    generarPDFCierreCaja,
    getTotalesCaja,


    ///promos

    pruebaPromos
} = require('../controllers/ventasController');

const authMiddleware = require('../middlewares/loginMiddleware');


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
router.patch('/cerrar-caja/:id_usuario', cerrarCajaUsuario);
router.patch('/eliminar-producto/:id_usuario', eliminarProductoVenta);
router.patch('/pagar-efectivo', pagarFacturaEfectivo);
router.patch('/pagar-transferencia', pagarFacturaTransferencia);
router.delete('/eliminar-venta/:id_venta/:id_factura', eliminarVenta);

// Añadir esta línea junto con las otras rutas
router.get('/factura/:id_venta/:id_usuario', generarFactura);

router.post('/generar-pdf-cierre/:id_usuario', generarPDFCierreCaja);
router.get('/totales-caja/:id_usuario',getTotalesCaja);



///promos
router.get('/get-promociones/:id_producto', pruebaPromos);
module.exports = router;
