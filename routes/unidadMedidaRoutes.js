const express = require('express');
const router = express.Router();
const { getUnidad, getUnidadbyUsuario, postUnidad, patchUnidad, getTotalUnidadporProducto, getProductosUnidad } = require('../controllers/unidadMedidaController.js');

router.get('/', getUnidad);
router.get('/:id_usuario', getUnidadbyUsuario);
router.get('/totalp-unidad/:id_unidad', getTotalUnidadporProducto);
router.get('/productos-unidad/:id_unidad', getProductosUnidad);
router.post('/crearunidad', postUnidad);
router.patch('/actualizarunidad/:id_unidad_medida', patchUnidad);

module.exports = router;
