const express = require('express');
const router = express.Router();

//crear las variables de las rutas
const registerRoutes = require('./empresaRoutes');
const loginRoutes = require('./loginRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const recuperarRoutes = require('./recuperarRouter');
const perfilRoutes = require('./perfilRoutes');
const sucursaleRoutes = require('./sucursaleRoutes');
const usuarioRoutes = require('./usuarioRoutes');

const routerCategoriaProducto = require('./categoriaProutes.js');
const routerUsuario = require('./usuarioRoutes.js');
const routerSesion = require('./sesionRoutes.js');
const routerSucursal = require('./sucursalRouters.js');


// Usar las rutas web

router.use('/empresa', registerRoutes);
router.use('/login', loginRoutes);
router.use('/categoria', categoriaRoutes);
router.use('/recuperar', recuperarRoutes);
router.use('/perfil', perfilRoutes);
router.use('/sucursales', sucursaleRoutes);
router.use('/usuarios', usuarioRoutes);



router.use('/categoria-producto', routerCategoriaProducto);
router.use('/usuario', routerUsuario);
router.use('/sesion-user', routerSesion);
router.use('/sucursales', routerSucursal);







module.exports = router;
