const express = require('express');
const router = express.Router();
const recuperarController = require('../controllers/recuperarController');

// Ruta para enviar el correo de recuperación de contraseña (POST)
router.post('/', recuperarController.sendPasswordRecoveryEmail);

// Ruta para mostrar el formulario de restablecimiento de contraseña (GET)
router.get('/recuperar', recuperarController.mostrarFormularioRecuperacion);

// Ruta para procesar el restablecimiento de la contraseña (POST)
router.post('/reset-password', recuperarController.restablecerContrasena);


module.exports = router;