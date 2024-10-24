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
const configuserRoutes = require('./configuserRoutes');
const categoriProductoRouter = require('./categoriaProutes.js');
const usuarioRouter = require('./usuarioRoutes.js');
const sesionRouter = require('./sesionRoutes.js');
const sucursalRouter = require('./sucursalRouters.js');
const proveedorRouter = require('./proveedorRoutes.js');
const rolRouter = require('./rolRouter.js')
const unidadMedidaRouter = require('./unidadMedidaRoutes.js')
const configempresaRoutes = require('./configempresaRoutes');




// Usar las rutas web

router.use('/empresa', registerRoutes);
router.use('/login', loginRoutes);
router.use('/categoria', categoriaRoutes);
router.use('/recuperar', recuperarRoutes);
router.use('/perfil', perfilRoutes);
router.use('/sucursales', sucursaleRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/configuser', configuserRoutes);
router.use('/configempresa', configempresaRoutes);



router.use('/categoria-producto', categoriProductoRouter);
router.use('/usuario', usuarioRouter);
router.use('/sesion-user', sesionRouter);
router.use('/sucursales', sucursalRouter);
router.use('/proveedores', proveedorRouter);
router.use('/roles', rolRouter);
router.use('/unidad-medida', unidadMedidaRouter);








module.exports = router;
