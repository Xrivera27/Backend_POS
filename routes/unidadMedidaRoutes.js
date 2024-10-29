const express = require('express');
const router = express.Router();
const { getUnidad, getUnidadbyUsuario, postUnidad, patchUnidad, getTotalUnidadporProducto, getProductosUnidad, deleteUnidad } = require('../controllers/unidadMedidaController.js');

router.get('/', getUnidad);
router.get('/:id_usuario', getUnidadbyUsuario);
router.get('/totalp-unidad/:id_unidad', getTotalUnidadporProducto);
router.get('/productos-unidad/:id_unidad', getProductosUnidad);
router.post('/crearunidad', postUnidad);
router.patch('/actualizarunidad/:id_unidad_medida', patchUnidad);
router.delete('/eliminarunidad/:id_unidad', deleteUnidad);

module.exports = router;
