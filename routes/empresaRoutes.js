const express = require('express');
const router = express.Router();
const {register, getDatosEmpresa} = require('../controllers/empresaController'); // Importar el controlador

// Ruta POST para registrar una empresa
router.post('/', register);
router.get('/obtener-datos/:id_usuario', getDatosEmpresa);

module.exports = router;
