const express = require('express');
const router = express.Router();

const { getUsuario, getUsuarioOfEmpresa } = require('../controllers/usuarioController');
const authMiddleware = require('../middlewares/loginMiddleware');

// Ruta para obtener información del usuario logueado (requiere token)
router.get('/', authMiddleware, getUsuario); // Cambia '/' por '/usuarios'
router.get('/getBy-empresa/:id_usuario', getUsuarioOfEmpresa);

module.exports = router;
