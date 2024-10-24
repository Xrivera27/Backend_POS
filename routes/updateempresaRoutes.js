const express = require('express');
const router = express.Router();

const { getempresaupdate } = require('../controllers/updateempresaController');
const authMiddleware = require('../middlewares/loginMiddleware');

// Ruta para actualizar información del usuario logueado (requiere token)
router.put('/', authMiddleware, getempresaupdate);

module.exports = router;
