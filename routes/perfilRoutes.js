const express = require('express');
const router = express.Router();

const { getUsuarioPerfil } = require('../controllers/perfilController');
const authMiddleware = require('../middlewares/loginMiddleware');

// Ruta para obtener información del usuario logueado (requiere token)
router.get('/', authMiddleware, getUsuarioPerfil); // Cambia '/' por '/usuarios'

module.exports = router;
