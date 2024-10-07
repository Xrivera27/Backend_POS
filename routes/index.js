const express = require('express');
const router = express.Router();

//crear las variables de las rutas
const registerRoutes = require('./empresaRoutes');
const loginRoutes = require('./loginRoutes');
const categoriaRoutes = require('./categoriaRoutes');

// Usar las rutas web
router.use('/empresa', registerRoutes);
router.use('/login', loginRoutes);
router.use('/categoria', categoriaRoutes);





module.exports = router;
