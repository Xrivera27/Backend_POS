// routes/empresaRoutes.js
const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/EmpresaControllerPerdomo');

// Obtener todas las empresas activas
router.get('/', empresaController.getEmpresas);

// Obtener empresas activas por categoría
router.get('/categoria/:categoriaId', empresaController.getEmpresasByCategoria);

// Obtener una empresa activa específica
router.get('/:id', empresaController.getEmpresaById);

// Actualizar una empresa
router.patch('/:id', empresaController.updateEmpresa);

// Desactivar una empresa (soft delete)
router.delete('/:id', empresaController.deleteEmpresa);

module.exports = router;