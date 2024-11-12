const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/loginMiddleware');
const { 
    getPromocionesEmpresa,
    postPromocion,
    patchPromocion,
    cambiarEstadoPromocion,
    eliminarPromocion,
    getProductosEmpresa
} = require('../controllers/PromocionesPController');

// Rutas para promociones
router.get('/empresa', authMiddleware, getPromocionesEmpresa);
router.get('/productos/empresa', authMiddleware, getProductosEmpresa);
router.post('/crear-promocion', authMiddleware, postPromocion);
router.patch('/actualizar-promocion/:id', authMiddleware, patchPromocion);
router.patch('/cambiar-estado-promocion/:id', authMiddleware, cambiarEstadoPromocion);
router.delete('/eliminar-promocion/:id', authMiddleware, eliminarPromocion);

module.exports = router;