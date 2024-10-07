const express = require('express');
const router = express.Router();
const registerController = require('../controllers/empresaController'); // Importar el controlador

// Ruta POST para registrar una empresa
router.post('/', registerController.register);

module.exports = router;
