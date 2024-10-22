const express = require('express');
const router = express.Router();

const { getCategoriaProducto, getCategoriaProductoOfEmpresa, postCategoria, patchCategoria } = require('../controllers/categoriaProductoController.js');

router.get('/', getCategoriaProducto);
router.get('/:id_usuario', getCategoriaProductoOfEmpresa);
router.post('/crear-categoria', postCategoria);
router.patch('/actualizar-categoria/:id_categoria', patchCategoria);

module.exports = router;