const express = require('express');
const router = express.Router();

const { getDatoSAR } = require('../controllers/updatesarController');
const authMiddleware = require('../middlewares/loginMiddleware');

// Ruta para actualizar información del usuario logueado (requiere token)
router.put('/', authMiddleware, getDatoSAR);

module.exports = router;
