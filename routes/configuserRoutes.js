const express = require('express');
const router = express.Router();
const { 
  updateUsuario, 
  verificarDuplicados,
  verificarPassword 
} = require('../controllers/configuserController');
const authMiddleware = require('../middlewares/loginMiddleware');

// Ruta para actualizar información del usuario
router.put('/', authMiddleware, updateUsuario);

// Ruta para verificar duplicados
router.post('/verificar-duplicados', authMiddleware, verificarDuplicados);

// Ruta para verificar contraseña actual
router.post('/verificar-password', authMiddleware, verificarPassword);

module.exports = router;