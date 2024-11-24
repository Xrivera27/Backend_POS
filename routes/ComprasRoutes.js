const express = require('express');
const router = express.Router();
const { 
    registrarCompra, 
    obtenerCompras,
    obtenerDetalleCompra,
    obtenerProductos
} = require('../controllers/ComprasController');
const authMiddleware = require('../middlewares/loginMiddleware');




router.get('/productos', authMiddleware, obtenerProductos);


// Rutas para compras
router.post('/registrar', authMiddleware, registrarCompra);
router.get('/lista', authMiddleware, obtenerCompras);
router.get('/detalle/:id_compra', authMiddleware,obtenerDetalleCompra);

module.exports = router;