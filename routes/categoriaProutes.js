const express = require('express');
const router = express.Router();

const { 
    getCategoriaProducto, 
    getCategoriaProductoOfEmpresa, 
    postCategoria, 
    patchCategoria, 
    desactivarCategoria, 
    eliminarCategoria,
    getTotalCatProd
} = require('../controllers/categoriaProductoController.js');

router.get('/', getCategoriaProducto);
router.get('/:id_usuario', getCategoriaProductoOfEmpresa);
router.get('/existencia/:id_categoria_producto', getTotalCatProd);
router.post('/crear-categoria', postCategoria);
router.patch('/actualizar-categoria/:id_categoria', patchCategoria);
router.patch('/desactivar-categoria/:id_categoria', desactivarCategoria);
router.delete('/eliminar-categoria/:id_categoria', eliminarCategoria);
module.exports = router;