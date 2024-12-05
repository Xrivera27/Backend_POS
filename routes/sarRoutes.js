const express = require('express');
const router = express.Router();

const { getDatosSAR, createDatosSAR } = require('../controllers/sarController');
const authMiddleware = require('../middlewares/loginMiddleware');

// Ruta para obtener datos SAR activos
router.get('/', authMiddleware, getDatosSAR);

// Ruta para crear nuevo registro SAR
router.post('/create', authMiddleware, createDatosSAR);

module.exports = router;
