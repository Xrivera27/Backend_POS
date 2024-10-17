const express = require('express');
const router = express.Router();

const { getUsuario } = require('../controllers/usuarioController');
const authMiddleware = require('../middlewares/loginMiddleware');

// Ruta para obtener información del usuario logueado (requiere token)
router.get('/', authMiddleware, getUsuario); // Cambia '/' por '/usuarios'

module.exports = router;
