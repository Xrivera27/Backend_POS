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


//Administrar Compras y Ventas

const AdminVentas = require('./AdminVentasRoutes');
const AdminCompras = require('./AdminComprasRoutes');


// Reporte
const Reportes = require('./ReporteRoutes');


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
const ClienteReporte = require('./clientereporteRoutes');
const alertsRouter = require('./alertsRoutes.js');


//ventas y compras
const ventasRouter = require('./ventasRouter.js');
const comprasRouter = require('./ComprasRoutes');

// Promociones
const PromocionesP = require('./PromocionesPRoutes');
const PromocionesC = require('./PromocionesCRoutes');

//Token SideBar
const TokenRoute = require('./TokenRoute');

// Dashboard
const dashboardRouter  = require('./dashboardRoutes.js')



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
router.use('/Clientes', ClienteReporte);


//Promociones
router.use('/promocionesP', PromocionesP);
router.use('/promocionesC', PromocionesC);



//empresas rutas
router.use('/sar', sarRoutes);
router.use('/empresa', registerRoutes);
router.use('/categoria', categoriaRoutes);

//cruds
router.use('/clientes', clientesRoutes);
router.use('/proveedores', proveedorRouter);
router.use('/usuarios', usuarioRoutes);
router.use('/usuario', usuarioRouter);

//Reporte
router.use('/reporte', Reportes);


//sucursales y productos
router.use('/categoria-producto', categoriProductoRouter);
//router.use('/sucursales', sucursaleRoutes);
router.use('/sucursales', sucursalRouter);
router.use('/productos', productosRoutes);
router.use('/inventario', inventarioRouter);
router.use('/unidad-medida', unidadMedidaRouter);
router.use('/alertas', alertsRouter);

//ventas y compras
router.use('/ventas', ventasRouter);
router.use('/compras', comprasRouter);

//Administrar Ventas y Compras
router.use('/AdminVentas', AdminVentas);
router.use('/AdminCompras', AdminCompras);


//Token SideBar
router.use('/token', TokenRoute);


// Dashboard
router.use('/dashboard', dashboardRouter);



module.exports = router;
