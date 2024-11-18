const { getSucursalesbyUser, getDatosSarSucursal } = require('../db/sucursalUsuarioSvc.js');

const { format } = require('date-fns');
const { getEmpresaId } = require('../db/empresaSvc.js');
const { 
    buscarProductoInventario, 
    reducirInventario, 
    addInventarioRollBack, 
    verificarInventarioRollBack, 
    eliminarInventarioRollBack,
    eliminarInventarioRollBackEsp,
    setNullRollBack,
    eliminarCompraGuardada
} = require('../db/inventarioSvc.js');
const calculos = require('../db/ventasSvs.js');

const getPrePage = async (req, res) => {
    const supabase = req.supabase;
    try {
        const id_usuario = req.params.id_usuario;
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

        const { data: sucursal, error } = await supabase.from('Sucursales')
        .select('nombre_administrativo')
        .eq('id_sucursal', id_sucursal)
        .single();

        const { data: usuario, errorUser } = await supabase.from('Usuarios')
        .select('nombre, apellido')
        .eq('id_usuario', id_usuario)
        .single();

        if (error) {
            console.error('Error al obtener los datos de la tabla:', error.message);
            throw new Error('Ocurrió un error al obtener datos de la tabla principal.');
        }
    
        if (errorUser) {
            console.error('Error al obtener los datos del usuario:', errorUser.message);
            throw new Error('Ocurrió un error al obtener datos del usuario.');
        }

        const nombreSucursal = sucursal.nombre_administrativo;
        const nombre_usuario = `${usuario.nombre} ${usuario.apellido}`;
        const fechaFormateada = format(new Date(), 'yyyy-MM-dd');

        res.status(200).json({
            id_sucursal: id_sucursal,
            nombre_usuario: nombre_usuario,
            nombreSucursal: nombreSucursal,
            fecha: fechaFormateada
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
    
}

const getProductPage = async (req, res) => {
    const supabase = req.supabase;
  //  let cantidadNull = 0;
    try {
        const id_usuario = req.params.id_usuario;
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

        const { data: inventarios, error } = await supabase.from('inventarios')
        .select('id_producto')
        .eq('id_sucursal', id_sucursal)
        .eq('estado', true)
        .gt('stock_actual', 0 );

        if(error){
            console.error('Error al obtener los datos de la tabla:', error.message);
            throw new Error('Ocurrió un error al obtener datos de la tabla inventario.');
        }

        let arrayProductos = [];

        const promesas = inventarios.map(async(producto) => {

            const { data: p, errorProducto } = await supabase.from('producto')
            .select('id_producto, codigo_producto, nombre, descripcion, precio_unitario, precio_mayorista, cantidad_activar_mayorista, impuesto')
            .eq('id_producto', producto.id_producto)
            .eq('estado', true)
            .single();

            if(errorProducto){
                console.error('Error al obtener los datos de la tabla:', errorProducto.message);
                throw new Error('Ocurrió un error al obtener datos de la tabla inventario.');
            }

        if(p){
            if((p.precio_mayorista && p.cantidad_activar_mayorista) && 
            (p.precio_mayorista > 0 && p.cantidad_activar_mayorista > 0) ){
                p.precioImpuestoMayorista = calculos.impuestoProducto(p.precio_mayorista, p.impuesto);
            }
            else{
                p.precioImpuestoMayorista = 0;
                p.cantidad_activar_mayorista = 0;
            }
            p.precioImpuesto = calculos.impuestoProducto(p.precio_unitario, p.impuesto);
            return p;
        }

        return null;
            
        });
        

     arrayProductos =  (await Promise.all(promesas)).filter(Boolean);
   //  console.log(cantidadNull);
   //  console.log(arrayProductos);


        res.status(200).json(
        arrayProductos
           );

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

  const verificarRtn = async (req, res) => {
    const supabase = req.supabase;
    const rtn = req.params.rtn;
    try {
        const { data: cliente, error } = await supabase.from('Clientes')
        .select('id_cliente, nombre_completo, rtn')
        .eq('rtn', rtn)
        .single();

        if(!cliente){
            return res.status(500).json({existe: false});
        }

        if(error){
            console.error('Error al obtener los datos de la tabla:', error.message);
            throw new Error('Ocurrió un error al obtener datos de la tabla inventario.');
        }

        res.status(200).json(cliente);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }

  }

  const selectProductoCodigo = async (req, res) => {
    const supabase = req.supabase;

    const { codigo, cantidad } = req.body;
    const id_usuario = req.params.id_usuario;

    try {

        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        const { data: producto, error } = await supabase.from('producto')
        .select('id_producto, nombre, precio_unitario, impuesto')
        .eq('codigo_producto', codigo)
        .eq('estado', true)
        .eq('id_empresa', id_empresa)
        .single();

        if(!producto || !await buscarProductoInventario(producto.id_producto, id_sucursal, supabase)){
            return res.status(500).json({existe: false});
        }
        
        if (error){
            console.error('Error al obtener los datos de la tabla:', error.message);
            throw new Error('Ocurrió un error al obtener datos de la tabla producto.');
        }

        const id_inventario = await reducirInventario(producto.id_producto, id_sucursal, cantidad, supabase);

        if (!id_inventario){
            console.error('Error al actualizar inventario');
            throw new Error('Ocurrió un error al actualizar inventario.');
        }

         if(!await addInventarioRollBack(id_inventario, id_usuario, cantidad, supabase)){
            console.error('Error al actualizar inventario roll back');
            throw new Error('Ocurrió un error al actualizar inventario roll back.');
         }

        res.status(200).json({
            message: 'Actualizacion de inventario exitosa!'
        });
        

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
  }

  const guardarVenta = async (req, res) => {
    try {
        const id_usuario = req.params.id_usuario;
        const supabase = req.supabase;
        const { nombre_completo } = req.body;

        const { data: compra_guardada, error: errorCompra } = await supabase
            .from('compras_guardada')
            .insert({ nombre_cliente: nombre_completo })
            .select('id_compra_guardada');

        if (errorCompra) {
            console.error("Error al guardar la compra:", errorCompra);
            return res.status(500).json({
                error: "Error al guardar la compra. Por favor, inténtelo nuevamente más tarde."
            });
        }

        const { data: inventario_roll_back ,error: errorInventario } = await supabase.from('inventario_roll_back')
        .update({
            id_compra_guardada: compra_guardada[0].id_compra_guardada
        })
        .eq('id_usuario', id_usuario)
        .is('id_compra_guardada', null)
        .select('*');

        if(!inventario_roll_back){
            console.error("Error al guardar inventario rollback:", errorInventario);
            throw "No hay compras registradas para este usuario aun.";
        }

        if (errorInventario) {
            console.error("Error al guardar inventario rollback:", errorInventario);
            throw "Error al guardar inventario roll back. Por favor, inténtelo nuevamente más tarde.";
        }

        return res.status(200).json({
            mensaje: "Venta guardada exitosamente.",
            id_compra_guardada: compra_guardada[0].id_compra_guardada,
        });

    } catch (error) {
        console.error("Error inesperado:", error);
        return res.status(500).json({
            error: `Ha ocurrido un error inesperado: ${error}`
        });
    }
}

const getVentasGuardadas = async (req, res) => {
    try {
        const supabase = req.supabase;
        const id_usuario = req.params.id_usuario;
        
        const { data: inventario_roll_back, error: errorInventario } = await supabase.from('inventario_roll_back')
        .select('id_inventario_roll_back, id_compra_guardada')
        .eq('id_usuario', id_usuario)
        .not('id_compra_guardada','is',null);

        if (errorInventario) {
            console.error("Error al obtener inventario rollback:", errorInventario);
            throw "Error al obtener roll back. Por favor, inténtelo nuevamente más tarde.";
        }

        const promesas = inventario_roll_back.map(async(inventario) => {
            const { data: compras, error: errorCompras } = await supabase.from('compras_guardada')
            .select('id_compra_guardada, nombre_cliente')
            .eq('id_compra_guardada', inventario.id_compra_guardada)
            .single();

            if (errorCompras) {
                console.error("Error al obtener ventas guardadas:", errorCompras);
                throw "Error al guardar obtener ventas guardadas. Por favor, inténtelo nuevamente más tarde.";
            }
            
            return compras;
        });

        const compras = await Promise.all(promesas);

        const comprasUnicas = Array.from(
            new Map(compras.map(compra => [compra.id_compra_guardada, compra])).values()
        );

        res.status(200).json(comprasUnicas);

        
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
    
}

const recuperarVentaGuardada = async (req, res) => {
    try {
        const supabase = req.supabase;
        const id_compra_guardada = req.params.id_compra_guardada;
        const { data: inventario_roll_back, error: inventarioError } = await supabase
        .from('inventario_roll_back')
        .select('id_inventario, cantidad')
        .eq('id_compra_guardada', id_compra_guardada);

        if (inventarioError) {
            console.error("Error al obtener inventario rollback: ", inventarioError);
            throw "Error al obtener roll back. Por favor, inténtelo nuevamente más tarde.";
        }

        if (inventario_roll_back.length < 1) {
            console.error("Error al obtener inventario rollback: ", 'No hay un carrito con ese ID');
            throw "Error al obtener roll back. Por favor, inténtelo nuevamente más tarde.";
        }

        const promesas = inventario_roll_back.map(async(inventario) => {
            const { data: codigo_producto, error: errorProducto } = await supabase
            .rpc('obtenercodigoproducto', {id_inventario_param: inventario.id_inventario});

            if (errorProducto) {
                console.error("Error al obtener productos: ", errorProducto);
                throw "Error al obtener codigo de producto. Por favor, inténtelo nuevamente más tarde.";
            }
            const cantidad = inventario.cantidad;
            return {codigo_producto, cantidad};
        });

        await setNullRollBack(id_compra_guardada, supabase);
        await eliminarCompraGuardada(id_compra_guardada, supabase);
        

        const productos = await Promise.all(promesas);

        res.status(200).json(productos);


    } catch (error) {
                res.status(500).json({
            error: error
        })
    }
}

  const postVenta = async (req, res) => {
    const supabase = req.supabase;
    const {
        id_cliente,
        productos

     } = req.body;

     const id_usuario = req.params.id_usuario;

     try {
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

        if (productos.length <= 0){
            console.error('Error al recibir productos:', error.message);
            throw new Error('No se recibieron productos.');
         }

         const asignar = {};
         asignar.id_sucursal = id_sucursal;
         asignar.id_usuario = id_usuario;
         asignar.estado = 'Pendiente de pago';
         if(id_cliente !== 0 || id_cliente !== null){asignar.id_cliente = id_cliente}
         
        const { data: venta, error } = await supabase.from('Ventas')
        .insert([asignar]).select('id_venta');
   
        if(error){
           console.error('Error al obtener los datos de la tabla:', error.message);
           throw new Error('Ocurrió un error al obtener datos de la tabla producto.');
        }

      const {exitos, factura} = await calculos.calcularDetallesVenta(venta[0].id_venta, productos, supabase);

       if (exitos != productos.length){
        throw 'Algunos productos no fueron agregados';
       }

       const datosSAR = await getDatosSarSucursal(id_usuario, supabase);
       if(datosSAR){
        const crearFacturaSAR = await calculos.postFacturaSar(factura.id_factura, datosSAR.numero_CAI, id_sucursal, supabase);
        if(!crearFacturaSAR){
         throw 'Factura SAR no generada';
        }
       }

       


        res.status(200).json({ 
            id_venta: venta[0].id_venta,
            factura: factura });
   
     } catch (error) {
        res.status(500).json({
            error: error.message
        });
     }
  }

  const eliminarProductoVenta = async (req, res) => {
    const id_usuario = req.params.id_usuario;
    const { id_producto } = req.body;
    const supabase = req.supabase;
    try {
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);
        const inventario = await buscarProductoInventario(id_producto, id_sucursal, supabase);
        

        if(!inventario){
            throw 'El producto no existe en inventario del local';
        }
        console.log(inventario.id_inventario);
        const inventario_roll_back = await verificarInventarioRollBack(inventario.id_inventario, id_usuario, supabase);
        

        if(!inventario_roll_back || inventario_roll_back === null){
            throw 'No existe roll back de este producto';
        }

        await eliminarInventarioRollBackEsp(inventario, inventario_roll_back.id_inventario_roll_back, supabase);

        res.status(200).json({ message: 'Producto eliminado de venta y repuesto en inventario.' })
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        })
    }
  }

  const pagarFacturaEfectivo = async (req, res) => {
    const supabase = req.supabase;
    const { pago, id_venta, id_usuario } = req.body;

    try {
        const totalFactura = await calculos.obtenerTotalFactura(id_venta, supabase);

        if(totalFactura > pago){
            return res.status(500).json({response: 'Saldo insuficiente'});
        }

        const { data: cambio, error } = await supabase.from('facturas')
        .update({
            pago: pago,
            cambio: pago - totalFactura,
            tipo_factura: "Efectivo"
        }).select('cambio')
        .eq('id_venta', id_venta);

        if(error){
            console.error('Error al obtener los datos de la tabla:', error.message);
            throw new Error('Ocurrió un error al obtener datos de la tabla inventario.');
        }

        if(!await calculos.cambiarEstadoVenta(id_venta, supabase, 'Pagada')){
            throw 'Error al cambiar estado de venta.';
        }
        

        await eliminarInventarioRollBack( id_usuario, supabase);

        res.status(200).json(cambio);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
  }

  const cajaAbiertaUsuario = async(req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.params.id_usuario;
    try {

        const caja = await calculos.existeCaja(id_usuario, supabase);
        
        if(!caja.resultado){
           return res.status(500).json({
                respuesta: 'Este usuario no tiene una caja abierta aun.'
            });
        }

            return res.status(200).json(caja.caja);

        

    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: error
        });
    }
  }

  const cerrarCajaUsuario = async(req, res) => {
    const supabase = req.supabase;
    const { id_usuario } = req.body;
    try {
        const {resultado, caja} = await calculos.existeCaja(id_usuario, supabase);
        
        if(!resultado){
           return res.status(500).json({
                respuesta: 'Este usuario no tiene una caja abierta aun.'
            });
        }

        const { data: cajaCerrada, error } = await supabase
        .from('caja')

        .update({
            abierto: false
        })
        .select('id_caja, valor_inicial, valor_actual')
        .eq('id_caja', caja.id_caja);

        if( error ){
            console.error('Ocurrio un error al cerrar caja', error);
            throw 'No se cerro la caja, intentelo mas tarde';
        }

        res.status(200).json(cajaCerrada);

    } catch (error) {
        console.error('Ocurrio un error: ', error);
        res.status(500).json({
            error: error
        })
    }
  }

  const crearCajaUsuario = async(req, res) => {
    const supabase = req.supabase;
    const { id_usuario, valor_inicial } = req.body;
    try {
        const {resultado} = await calculos.existeCaja(id_usuario, supabase);
        
        if(resultado){
           return res.status(500).json({
                respuesta: 'Este usuario ya tiene una caja abierta.'
            });
        }

        const { data: cajaCreada, error } = await supabase
        .from('caja')
        .insert({
            id_usuario: id_usuario,
            valor_inicial: valor_inicial,
            valor_actual: valor_inicial
        })
        .select('id_caja, valor_inicial, valor_actual');

        if( error ){
            console.error('Ocurrio un error al crear caja', error);
            throw 'No se creo la caja, intentelo mas tarde';
        }

        res.status(200).json(cajaCreada);

    } catch (error) {
        console.error('Ocurrio un error: ', error);
        res.status(500).json({
            error: error
        });
    }
  }

module.exports = { 
    getPrePage, 
    getProductPage, 
    verificarRtn, 
    selectProductoCodigo, 
    guardarVenta, 
    getVentasGuardadas, 
    recuperarVentaGuardada, 
    postVenta, 
    pagarFacturaEfectivo, 
    eliminarProductoVenta, 
    crearCajaUsuario,
    cajaAbiertaUsuario,
    cerrarCajaUsuario
}