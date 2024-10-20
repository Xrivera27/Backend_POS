const express = require('express');
const router = express.Router();

const { updateUsuario } = require('../controllers/configuserController');
const authMiddleware = require('../middlewares/loginMiddleware');

// Ruta para actualizar información del usuario logueado (requiere token)
router.put('/', authMiddleware, updateUsuario);

module.exports = router;
