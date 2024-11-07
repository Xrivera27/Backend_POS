// routes/customersRoutes.js
const express = require('express');
const { getClientesPorEmpresa } = require('../controllers/clientesreporteController');
const ClienteMiddleware = require('../middlewares/clientesMiddleware');

const router = express.Router();

// Ruta para obtener clientes por ID de empresa
router.get('/clientes/:empresaId',ClienteMiddleware, getClientesPorEmpresa);

module.exports = router;
