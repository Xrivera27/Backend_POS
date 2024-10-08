const express = require('express');
const router = express.Router();

//crear las variables de las rutas
const registerRoutes = require('./empresaRoutes');
const loginRoutes = require('./loginRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const recuperarRoutes = require('./recuperarRouter');

// Usar las rutas web
router.use('/empresa', registerRoutes);
router.use('/login', loginRoutes);
router.use('/categoria', categoriaRoutes);
router.use('/recuperar', recuperarRoutes); 






module.exports = router;
