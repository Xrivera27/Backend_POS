const { getSucursalesbyUser } = require('../db/sucursalUsuarioSvc.js');
const { format } = require('date-fns');
const { getEmpresaId } = require('../db/empresaSvc.js');

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
    const rtn = req.params. rtn;
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

  const getProductobyCodigo = async (req, res) => {
    const supabase = req.supabase;
    const codigoProducto = req.params.codigo;
    const id_usuario = req.params.id_usuario;

    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        const { data: producto, error } = await supabase.from('producto')
        .select('id_producto, nombre, precio_unitario')
        .eq('codigo_producto', codigoProducto)
        .eq('estado', true)
        .eq('id_empresa', id_empresa)
        .single();

        if(!producto){
            return res.status(500).json({existe: false});
        }
        
        if (error){
            console.error('Error al obtener los datos de la tabla:', error.message);
            throw new Error('Ocurrió un error al obtener datos de la tabla producto.');
        }

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
        id_sucursal,
        id_usuario,
        productos

     } = req.body;

     try {

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

       const {exitos, factura} = await calcularDetallesVenta(venta[0].id_venta, productos, supabase);

       if (exitos != productos.length){
        throw 'Alguno productos no fueron agregados';
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

  const calcularDetallesVenta = async (id_venta, productos, supabase) => {

    let exitos = 0;
    let totalDetalle = 0;
    let subTotalVenta = 0;
    
    for (const elementoProducto of productos){

        try {
            
        const { data:  producto, error } = await supabase.from('producto')
        .select('precio_unitario, precio_mayorista, cantidad_activar_mayorista')
        .eq('id_producto',elementoProducto.id_producto)
        .single();


        if(error){
            console.error('Error al obtener los datos de la tabla:', error.message);
            throw new Error('Ocurrió un error al obtener datos de la tabla producto.');
        }

        if (
            producto.precio_mayorista > 0 && 
            producto.precio_mayorista !== null && 
            producto.precio_mayorista !== undefined &&
            producto.cantidad_activar_mayorista <= elementoProducto.cantidad
        )
            {
                totalDetalle = producto.precio_mayorista * elementoProducto.cantidad;
                elementoProducto.precio_usar = producto.precio_mayorista;
        }
        else {
            totalDetalle = producto.precio_unitario * elementoProducto.cantidad;
            elementoProducto.precio_usar = producto.precio_unitario;
        }

    } catch (error) {
        console.error('Error en el proceso:', error);
        return 'Error al aplicar calcular detalles venta '+error;
    }

    try{
        const { error } = await supabase.from('ventas_detalles')
        .insert({
            id_venta: id_venta,
            id_producto: elementoProducto.id_producto,
            cantidad: elementoProducto.cantidad,
            total_detalle: totalDetalle
        }).select('*');

        if(error){
            console.error('Error al obtener los datos de la tabla:', error.message);
            throw new Error('Ocurrió un error al insertar datos de la tabla detalles ventas.');
        }

        subTotalVenta += totalDetalle;

        exitos++;
    }

         catch (error) {
            console.error('Error en el proceso:', error);
            return 'Error al aplicar calcular detalles venta '+error;
        }

    }

    try {
        const { data: venta, error } = await supabase.from('Ventas')
        .update({
            sub_total: subTotalVenta
        })
        .eq('id_venta', id_venta);

        if (error){
            console.error('Error al obtener los datos de la tabla factura:', error.message);
            throw new Error('Ocurrió un error al obtener datos de la tabla producto.');
        }

       const factura =  await postFactura(id_venta, productos, supabase);
        return {exitos, factura};

    } catch (error) {
        console.error('Error en el proceso:', error);
        return 'Error al aplicar subtotal venta '+error;
    }

  }

  const postFactura = async (id_venta, productos, supabase) => {
    let arrayProductos = [];
    let subtotalTabla;

    for (const producto of productos){
        
        const { data: productosRegistros, error } = await supabase.from('producto')
        .select('id_producto, codigo_producto, impuesto')
        .eq('id_producto', producto.id_producto)
        .single();

        if(error){
            console.error('Error al obtener los datos de la tabla factura:', error.message);
            throw new Error('Ocurrió un error al obtener datos de la tabla producto.');
         }
         productosRegistros.precio_usar = producto.precio_usar;
         productosRegistros.cantidad = producto.cantidad;
         arrayProductos.push(productosRegistros);

    }

    const impuestos = calcularImpuestos(arrayProductos);

    try {
        const {data: venta, error } = await supabase.from('Ventas')
        .select('sub_total')
        .eq('id_venta', id_venta)
        .single();

        if(error){
            console.error('Error al obtener los datos de la tabla Venta:', error.message);
            throw new Error('Ocurrió un error al obtener datos de la venta.');
         }

          subtotalTabla = venta.sub_total;
        
    } catch (error) {
        console.error('Error en el proceso:', error);
        return 'Error al aplicar calcular detalles venta '+error;
    }

    try {
        const { data: factura, error } = await supabase.from('facturas')
        .insert({
            id_venta: id_venta,
            tipo_factura: "Pendiente",
            total_extento: impuestos.extento,
            gravado_15: impuestos.gravado_15,
            gravado_18: impuestos.gravado_18,
            ISV_15: impuestos.ISV_15,
            ISV_18: impuestos.ISV_18,
            total_ISV: impuestos.total_impuesto,
            total: subtotalTabla + impuestos.total_impuesto
        }).select('total_extento, gravado_15, gravado_18, total');

        if(error){
            console.error('Error al insertar factura:', error.message);
            throw new Error('Ocurrió un error al registrar factura.');
         }


         factura[0].sub_total = subtotalTabla;
         return factura[0];

    } catch (error) {
        console.error('Error en el proceso:', error);
        return 'Error '+error;
    }
  }

  const calcularImpuestos = (productos) => {
    const objetoImpuestos = {
        extento: 0,
        gravado_15: 0,
        gravado_18: 0,
        ISV_15: 0,
        ISV_18: 0,
        total_impuesto: 0
    };

    for (const producto of productos){
        switch(producto.impuesto){
            case 1 || '1':
                objetoImpuestos.gravado_15 += (producto.precio_usar * producto.cantidad);
            break;

            case 2 || '2':
                objetoImpuestos.gravado_18 += (producto.precio_usar * producto.cantidad);
            break;

            case 3 || '3':
                objetoImpuestos.extento += (producto.precio_usar * producto.cantidad );
            break;

            default: console.log(`Impuesto: ${producto.impuesto} de producto ${producto.codigo_producto} no encontrado`);
        }
    }

    objetoImpuestos.ISV_15 = objetoImpuestos.gravado_15 * 0.15;
    objetoImpuestos.ISV_18 = objetoImpuestos.gravado_18 * 0.18;
    objetoImpuestos.total_impuesto = objetoImpuestos.ISV_15 + objetoImpuestos.ISV_18;

    return objetoImpuestos;

  }

  const pagarFacturaEfectivo = async (req, res) => {
    const supabase = req.supabase;
    const { pago, id_venta } = req.body;

    try {
        const totalFactura = await obtenerTotalFactura(id_venta, supabase);

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

        if(!await cambiarEstadoVenta(id_venta, supabase, 'Pagada')){
            throw 'Error al cambiar estado de venta.';
        }

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

module.exports = { getPrePage, getProductPage, verificarRtn, getProductobyCodigo, postVenta, pagarFacturaEfectivo }