const express = require('express');
const router = express.Router();
const { getUsuario } = require('../controllers/usuarioController.js');

// Ruta para obtener las categorías
router.get('/', getUsuario);

module.exports = router;
