const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/loginMiddleware');

const { 
    getCategoriasPromocionEmpresa,
    postCategoriaPromocion,
    patchCategoriaPromocion,
    cambiarEstadoCategoriaPromocion,
    eliminarCategoriaPromocion,
    getCategoriasEmpresa
} = require('../controllers/PromocionesCController');

// Rutas para promociones de categorías
router.get('/empresa', authMiddleware, getCategoriasPromocionEmpresa);
router.get('/categorias/empresa', authMiddleware, getCategoriasEmpresa);
router.post('/crear-promocion', authMiddleware, postCategoriaPromocion);
router.patch('/actualizar-promocion/:id', authMiddleware, patchCategoriaPromocion);
router.patch('/cambiar-estado-promocion/:id', authMiddleware, cambiarEstadoCategoriaPromocion);
router.delete('/eliminar-promocion/:id', authMiddleware, eliminarCategoriaPromocion);

module.exports = router;