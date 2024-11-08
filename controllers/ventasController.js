const { getSucursalesbyUser } = require('../db/sucursalUsuarioSvc.js');
const { format } = require('date-fns');
const { getEmpresaId } = require('../db/empresaSvc.js');
const { buscarProductoInventario, reducirInventario, addInventarioRollBack, eliminarInventarioRollBack } = require('../db/inventarioSvc.js');
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

        for (const producto of inventarios){
            const { data: p, errorProducto } = await supabase.from('producto')
            .select('id_producto, nombre, precio_unitario, estado')
            .eq('id_producto', producto.id_producto)
            .single();

            if(errorProducto){
                console.error('Error al obtener los datos de la tabla:', errorProducto.message);
                throw new Error('Ocurrió un error al obtener datos de la tabla inventario.');
            }

            if(!p.estado){
                continue;
            }

            arrayProductos.push(p);

        }

        const numeroActualSar = await getDatosSAR(id_sucursal, supabase);

        res.status(200).json({
            productos: arrayProductos,
            numeroActualSar: numeroActualSar
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getDatosSAR = async (id_sucursal, supabase) => {

    try { 
  
      const { data: datosSAR, error: sarError } = await supabase
        .from('Datos_SAR')
        .select('numero_actual_SAR')
        .eq('id_sucursal', id_sucursal)
        .single();
  
        if (sarError) {
            console.error('Error al consultar la base de datos:', sarError);
            throw 'Error al consultar la base de datos';
        }

        if (!datosSAR) {
            console.error('No se encontraron datos para la SAR con ID:', id_sucursal); 
            return false;
        }

        return datosSAR.numero_actual_SAR;

    } catch (error) {
        console.error('Error en el proceso:', error);
        return 'Error al obtener los datos de la SAR';
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

         if(!await addInventarioRollBack(producto.id_producto, id_usuario, cantidad, supabase)){
            console.error('Error al actualizar inventario roll back');
            throw new Error('Ocurrió un error al actualizar inventario roll back.');
         }

       producto.precioImpuesto = calculos.impuestoProducto(producto.precio_unitario, producto.impuesto);

        res.status(200).json(producto);
        

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
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
        const { data: venta, error } = await supabase.from('Ventas')
        .insert({
           id_cliente: id_cliente,
           id_sucursal: id_sucursal,
           id_usuario: id_usuario,
           estado: "pendiente de pago",
        }).select('id_venta');
   
        if(error){
           console.error('Error al obtener los datos de la tabla:', error.message);
           throw new Error('Ocurrió un error al obtener datos de la tabla producto.');
        }

      const {exitos, factura} = await calculos.calcularDetallesVenta(venta[0].id_venta, productos, supabase);

       if (exitos != productos.length){
        throw 'Algunos productos no fueron agregados';
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

        const detallesProductos = await calculos.obtenerProductosCantidad(id_venta, supabase);

        if( detallesProductos.length < 1 ){
            return res.status(500).json({
                errorMessage: 'Ocurrio un error al obtener los detalles de la venta, no se elimino del inventario',
                cambio: cambio[0].cambio
            });
        }

        await eliminarInventarioRollBack(detallesProductos, id_usuario, supabase);

        res.status(200).json(cambio);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
  }

  const obtenerTotalFactura = async (id_venta, supabase) => {
    try {
        const { data: totalfactura, error } = await supabase.from('facturas')
        .select('total')
        .eq('id_venta', id_venta)
        .single();

        if(error){
            console.error('Error al obtener los datos de la tabla:', error.message);
            throw new Error('Ocurrió un error al obtener total de facturas.');
        }

        return totalfactura.total;

    } catch (error) {
        console.error('Error en el proceso:', error);
        return 'Error al recuperar total de venta '+error;
    }
  }

  const cambiarEstadoVenta = async (id_venta, supabase, estado) => {
    try {
        const { data: venta, error } = await supabase.from('Ventas')
        .update({
            estado: estado
        })
        .select('estado')
        .eq('id_venta', id_venta);

        if(error){
            console.error('Error al obtener los datos de la tabla:', error.message);
            throw new Error('Ocurrió un error al actualizar estado de ventas.');
        }

        return true;

    } catch (error) {
        console.error('Error en el proceso:', error);
        return 'Error al recuperar total de venta '+error;
    }
  }

module.exports = { getPrePage, getProductPage, verificarRtn, selectProductoCodigo, postVenta, pagarFacturaEfectivo }