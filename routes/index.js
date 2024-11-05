const express = require('express');
const router = express.Router();

//logins
const sesionRouter = require('./sesionRoutes.js');
const loginRoutes = require('./loginRoutes');
const registerRoutes = require('./empresaRoutes');
const perfilRoutes = require('./perfilRoutes');
const recuperarRoutes = require('./recuperarRouter');

//configuraciones
const configuserRoutes = require('./configuserRoutes');
const sarRoutes = require('./sarRoutes');
const updatesarRoutes = require('./updatesarRoutes');
const configureempresaRoutes = require('./updateempresaRoutes');

//empresas rutas
const categoriaRoutes = require('./categoriaRoutes');
const configempresaRoutes = require('./configempresaRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const rolRouter = require('./rolRouter.js');

//cruds
const clientesRoutes = require('./clientesRoutes');
const proveedorRouter = require('./proveedorRoutes.js');
const usuarioRouter = require('./usuarioRoutes.js');

//sucursales y productos
const sucursalRouter = require('./sucursalRouters.js');
const sucursaleRoutes = require('./sucursaleRoutes');
const productosRoutes = require('./productosRoutes.js');
const unidadMedidaRouter = require('./unidadMedidaRoutes.js')
const categoriProductoRouter = require('./categoriaProutes.js');
const inventarioRouter = require('./inventariosRoutes.js');

//ventas y compras
const ventasRouter = require('./ventasRouter.js');


//logins
router.use('/login', loginRoutes);
router.use('/perfil', perfilRoutes);
router.use('/recuperar', recuperarRoutes);
router.use('/sesion-user', sesionRouter);
router.use('/roles', rolRouter);

//configuraciones
router.use('/configuser', configuserRoutes);
router.use('/configempresa', configempresaRoutes);
router.use('/updateempresa', configureempresaRoutes);
router.use('/updsar', updatesarRoutes);

//empresas rutas
router.use('/sar', sarRoutes);
router.use('/empresa', registerRoutes);
router.use('/categoria', categoriaRoutes);

//cruds
router.use('/clientes', clientesRoutes);
router.use('/proveedores', proveedorRouter);
router.use('/usuarios', usuarioRoutes);
router.use('/usuario', usuarioRouter);


//sucursales y productos
router.use('/categoria-producto', categoriProductoRouter);
router.use('/sucursales', sucursaleRoutes);
router.use('/sucursales', sucursalRouter);
router.use('/productos', productosRoutes);
router.use('/inventario', inventarioRouter);
router.use('/unidad-medida', unidadMedidaRouter);

//ventas y compras
router.use('/ventas', ventasRouter);


module.exports = router;
