// routes/categoriaEmpresa.routes.js
const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/CategoriaEmpresaControllerPerdomo');

// Obtener todas las categorías
router.get('/', categoriaController.getCategorias);

// Obtener una categoría por ID
router.get('/:id', categoriaController.getCategoriaById);

// Crear nueva categoría
router.post('/', categoriaController.createCategoria);

// Actualizar categoría
router.patch('/:id', categoriaController.updateCategoria);

// Eliminar categoría
router.delete('/:id', categoriaController.deleteCategoria);

module.exports = router;