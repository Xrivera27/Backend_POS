const express = require('express');
const router = express.Router();
const recuperarController = require('../controllers/recuperarController');

// Ruta para enviar el correo de recuperación de contraseña (por enlace)
router.post('/', recuperarController.sendTemporaryPassword); // Verifica que el método sea correcto


module.exports = router;
