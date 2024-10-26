const express = require('express');
const router = express.Router();

const { getDatosSAR } = require('../controllers/sarController');
const authMiddleware = require('../middlewares/loginMiddleware');

// Ruta para actualizar información del usuario logueado (requiere token)
router.get('/', authMiddleware, getDatosSAR);

module.exports = router;
