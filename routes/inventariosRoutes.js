const { getInventarioByProducto, postOrPatchInventario } = require('../controllers/inventariosController.js');
const express = require('express');
const router = express.Router();

router.get('/:id_producto/:id_sucursal', getInventarioByProducto);
router.post('/actualizar/:id_producto/:id_sucursal', postOrPatchInventario);

module.exports = router;