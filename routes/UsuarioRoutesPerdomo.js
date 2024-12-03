// routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getUsuarios,
  postUsuario,
  patchUsuario,
  desactivarUsuario
} = require('../controllers/UsuarioControllerPerdomo');

// Rutas públicas sin middleware de autenticación
router.get('/', getUsuarios); // Obtiene todos los usuarios con rol 4
router.post('/crear', postUsuario); // Crea un nuevo usuario y lo asocia con una sucursal
router.patch('/actualizar/:id_usuario', patchUsuario); // Actualiza un usuario
router.patch('/desactivar/:id_usuario', desactivarUsuario); // Desactiva un usuario

module.exports = router;