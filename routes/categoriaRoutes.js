const express = require('express');
const router = express.Router();
const { getCategorias } = require('../controllers/categoriaController');

// Ruta para obtener las categorías
router.get('/', getCategorias);

module.exports = router;
