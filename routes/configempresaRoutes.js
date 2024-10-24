// routes/empresaRoutes.js
const express = require('express');
const { getEmpresaInfo } = require('../controllers/configempresaController');
const authMiddleware = require('../middlewares/loginMiddleware');
const router = express.Router();

// Ruta para obtener la información de la empresa
router.get('/', authMiddleware, getEmpresaInfo); // Aquí se espera el ID de usuario

module.exports = router;
