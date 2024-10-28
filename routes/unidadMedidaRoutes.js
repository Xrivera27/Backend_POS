const express = require('express');
const router = express.Router();
const { getUnidad, getUnidadbyUsuario, postUnidad, patchUnidad, getTotalUnidadporProducto } = require('../controllers/unidadMedidaController.js');

router.get('/', getUnidad);
router.get('/:id_usuario', getUnidadbyUsuario);
router.get('/totalp-unidad/:id_unidad', getTotalUnidadporProducto);
router.post('/crearunidad', postUnidad);
router.patch('/actualizarunidad/:id_unidad_medida', patchUnidad);

module.exports = router;
