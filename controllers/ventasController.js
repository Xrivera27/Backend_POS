const { getSucursalesbyUser, getDatosSarSucursal } = require('../db/sucursalUsuarioSvc.js');
const PDFDocument = require('pdfkit');
const { format } = require('date-fns');
const { getEmpresaId } = require('../db/empresaSvc.js');
const { obtenerPromos } = require('../db/promocionesSvs.js');
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

const pruebaPromos = async(req, res) => {
    const supabase = req.supabase;
    const id_producto = req.params.id_producto;
    try {
        
        const { promocionActiva, resultado, error} = await obtenerPromos(id_producto, supabase);
        if(!resultado){
            return res.status(500).json({error: error});
        }
  //      const { promociones, promocionesCategoria} = await obtenerPromos(id_producto, supabase);

        res.status(200).json(promocionActiva);
//res.status(200).json({promociones: promociones, promocionesCategoria: promocionesCategoria});
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
}

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
let descuento = 0;
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
            const { resultado, promocionActiva: {porcentaje_descuento} } = await obtenerPromos(p.id_producto, supabase);
            if((p.precio_mayorista && p.cantidad_activar_mayorista) && 
            (p.precio_mayorista > 0 && p.cantidad_activar_mayorista > 0) && !resultado ){
                p.precioImpuestoMayorista = calculos.impuestoProducto(p.precio_mayorista, p.impuesto);
            }
            else{
                p.precioImpuestoMayorista = 0;
                p.cantidad_activar_mayorista = 0;
                
            if(resultado){
                descuento = porcentaje_descuento / 100;
            }
            }
            const precioImpuesto = calculos.impuestoProducto(p.precio_unitario, p.impuesto)
            p.precioImpuesto = precioImpuesto - ( precioImpuesto * descuento );
            return p;
        }

        return null;
            
        });
        

     arrayProductos =  (await Promise.all(promesas)).filter(Boolean);

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
            .select('id_compra_guardada, nombre_cliente, created_at')
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

const getVentaPendiente = async (req, res) => {
    try {
        const supabase = req.supabase;
        const id_usuario = req.params.id_usuario;
        const { data: inventario_roll_back, error: inventarioError } = await supabase
        .from('inventario_roll_back')
        .select('id_inventario, cantidad')
        .eq('id_usuario', id_usuario)
        .is('id_compra_guardada', null);

        if (inventarioError) {
            //console.error("Error al obtener inventario rollback: ", inventarioError);
            throw "Error al obtener roll back. Por favor, inténtelo nuevamente más tarde.";
        }

        if (inventario_roll_back.length < 1) {
           // console.error("Error al obtener inventario rollback: ", 'No hay un carrito con ese ID');
            return res.status(200).json({
                resultado: false
            })
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

        const productos = await Promise.all(promesas);

        res.status(200).json({productos, resultado: true});


    } catch (error) {
                res.status(500).json({
            error: error
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
        productos,

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

         const promesas = [
            supabase.from('Ventas')
        .insert([asignar]).select('id_venta'),
        supabase.rpc('actualizar_num_factura', {id_sucursal_param: id_sucursal})
        .select('*'),
        calculos.existeCaja(id_usuario, supabase)
         ];

         const resultados = await Promise.all(promesas);

         
        const { data: venta, error } = resultados[0];

        const { data: num_factura, error: errorNumFactura } = resultados[1];

        const { resultado: resultadoCaja, caja, error: errorCaja } = resultados[2];

        if(errorNumFactura){
            console.error('Error al obtener los datos de la tabla:', errorNumFactura.message);
            throw new Error('Ocurrió un error al aumentar numero de factura en sucursal.');
         }

        if(error){
           console.error('Error al obtener los datos de la tabla:', error.message);
           throw new Error('Ocurrió un error al obtener datos de la tabla producto.');
        }

        if(errorCaja){
            console.error('Error al obtener los datos de la caja:', error.message);
            throw new Error(errorCaja);
         }

         if(!resultadoCaja){
            throw 'este usuario no tiene una caja abierta!';
         }

         console.log(caja);

        const datosCodigoFacturaCaja = {
            id_sucursal: id_sucursal,
            num_factura: num_factura,
            id_caja: caja.id_caja
        };

      const {exitos, factura} = await calculos.calcularDetallesVenta(venta[0].id_venta, datosCodigoFacturaCaja, productos, id_usuario, supabase);

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

  const eliminarVenta = async (req, res) => {
    const id_venta = req.params.id_venta;
    const id_factura = req.params.id_factura;
    const supabase = req.supabase;

    try {
        const { resultado, message } = await calculos.eliminarVenta(id_venta, id_factura, supabase);

        if( !resultado ){
            throw message;
        }
    
        res.status(200).json(message);

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
    const { pago, id_venta, id_usuario, descripcion } = req.body;
    console.log(pago);

    try {

        let promesas = [
            calculos.obtenerTotalFactura(id_venta, supabase),
            calculos.existeCaja(id_usuario, supabase)
        ];

        let resultados = await Promise.all(promesas);

        const totalFactura = resultados[0];
        const { resultado, caja } = resultados[1];

        if(!resultado){
            return res.status(500).json({response: 'Este usuario no tiene una caja abierta'});
        }

        if(totalFactura > pago){
            return res.status(500).json({response: 'Saldo insuficiente'});
        }

        promesas = [
            supabase.from('facturas')
        .update({
            pago: pago,
            cambio: pago - totalFactura,
            tipo_factura: "Efectivo",
        }).select('cambio')
        .eq('id_venta', id_venta),
        calculos.actualizarSaldoCaja(caja, totalFactura, supabase),
        calculos.cambiarEstadoVenta(id_venta, supabase, descripcion,'Pagada'),
        eliminarInventarioRollBack( id_usuario, supabase)
        ];

        resultados = await Promise.all(promesas);

        const { data: cambio, error } = resultados[0];
        const { resultado: resultadoSaldo, message } = resultados[1];
        const { resultado: resultadoEliminarRB, message: mensajeRB } = resultados[3];

        if(error){
            console.error('Error al obtener los datos de la tabla:', error.message);
            throw new Error('Ocurrió un error al obtener datos de la tabla inventario.');
        }

        if(!resultadoSaldo){
            throw new Error(message);
        }

        if(!resultados[2]){
            throw 'Error al cambiar estado de venta.';
        }

        if(!resultados[2]){
            throw 'Error al cambiar estado de venta.';
        }

        if(!resultadoEliminarRB){
            throw mensajeRB;
        }
        
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
        const date = new Date();
        const closed_at = date.toISOString();

        const {resultado, caja} = await calculos.existeCaja(id_usuario, supabase);
        
        if(!resultado){
           return res.status(500).json({
                respuesta: 'Este usuario no tiene una caja abierta aun.'
            });
        }

        const { data: cajaCerrada, error } = await supabase
        .from('caja')

        .update({
            abierto: false,
            closed_at: closed_at
        })
        .select('id_caja, created_at, closed_at, valor_inicial, valor_actual')
        .eq('id_caja', caja.id_caja);

        const reporteCaja = await calculos.reporteCaja(cajaCerrada[0], supabase);
     //   console.log(reporteCaja);

        if( error ){
            console.error('Ocurrio un error al cerrar caja', error);
            throw 'No se cerro la caja, intentelo mas tarde';
        }

        res.status(200).json(reporteCaja);

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
  };

  const generarFactura = async (req, res) => {
    const supabase = req.supabase;
    const id_venta = req.params.id_venta;
    const id_usuario = req.params.id_usuario;
  
    try {
        if (!id_venta || !id_usuario) {
            throw new Error('Parámetros incompletos');
        }

        const { data: venta, error: ventaError } = await supabase
        .from('Ventas')
        .select(`
            *,
            Clientes (
                nombre_completo,
                rtn,
                direccion
            ),
            facturas!inner (
                *,
                factura_SAR!inner (
                    numero_factura_SAR,
                    numero_CAI
                )
            ),
            Usuarios!inner (
                nombre,
                apellido
            )
        `)
        .eq('id_venta', id_venta)
        .single();

        if (ventaError || !venta) {
            console.error('Error al obtener venta:', ventaError);
            throw new Error('Error al obtener datos de venta');
        }
        console.log('Datos de venta:', venta);
        console.log('Datos completos de factura_SAR:', {
            numero_factura: venta.facturas[0].factura_SAR[0].numero_factura_SAR,
            cai: venta.facturas[0].factura_SAR[0].numero_CAI,
            datos_completos: venta.facturas[0].factura_SAR
        });

        const id_sucursal = venta.id_sucursal;
        if (!id_sucursal) {
            throw new Error('Sucursal no encontrada en la venta');
        }

        const { data: sucursal, error: sucursalError } = await supabase
            .from('Sucursales')
            .select('nombre_administrativo, direccion, telefono, correo, id_empresa')
            .eq('id_sucursal', id_sucursal)
            .single();
        
        if (sucursalError) {
            console.error('Error al obtener sucursal:', sucursalError);
            throw new Error('Error al obtener datos de sucursal');
        }
        console.log('Datos de sucursal:', sucursal);

        const { data: empresa, error: empresaError } = await supabase
            .from('Empresas')
            .select('nombre, telefono_principal, correo_principal')
            .eq('id_empresa', sucursal.id_empresa)
            .single();
        
        if (empresaError) {
            console.error('Error al obtener empresa:', empresaError);
            throw new Error('Error al obtener datos de empresa');
        }
        console.log('Datos de empresa:', empresa);

        const { data: detalles, error: detallesError } = await supabase
            .from('ventas_detalles')
            .select(`
                cantidad,
                descuento,
                total_detalle,
                producto (
                    nombre,
                    codigo_producto,
                    impuesto,
                    precio_unitario
                )
            `)
            .eq('id_venta', id_venta);

        if (detallesError) {
            console.error('Error al obtener detalles:', detallesError);
            throw new Error('Error al obtener detalles de venta');
        }
        console.log('Detalles de venta:', detalles);

        const { data: datosSAR, error: sarError } = await supabase
            .from('Datos_SAR')
            .select(`
                rango_inicial,
                rango_final,
                fecha_vencimiento
            `)
            .eq('id_sucursal', id_sucursal)
            .eq('activo', true)
            .single();

        if (sarError) {
            console.error('Error al obtener datos SAR:', sarError);
            throw new Error('Error al obtener datos SAR');
        }

        const numeroALetras = (numero) => {
            const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
            const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
            const especiales = {
                11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
                16: 'DIECISEIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
                21: 'VEINTIUNO', 22: 'VEINTIDOS', 23: 'VEINTITRES', 24: 'VEINTICUATRO', 25: 'VEINTICINCO',
                26: 'VEINTISEIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE'
            };
            const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

            const convertirMiles = (n) => {
                if (n === 0) return '';
                if (n === 1) return 'MIL ';
                return unidades[n] + ' MIL ';
            };

            const convertirCentenas = (n) => {
                if (n === 0) return '';
                if (n === 100) return 'CIEN ';
                return centenas[Math.floor(n / 100)] + ' ';
            };

            const convertirDecenas = (n) => {
                if (n === 0) return '';
                const decena = Math.floor(n / 10);
                const unidad = n % 10;
                
                if (n < 10) return unidades[n] + ' ';
                if (especiales[n]) return especiales[n] + ' ';
                if (unidad === 0) return decenas[decena] + ' ';
                if (decena === 2) return 'VEINTI' + unidades[unidad].toLowerCase() + ' ';
                return decenas[decena] + ' Y ' + unidades[unidad] + ' ';
            };

            const partes = Number(numero).toFixed(2).split('.');
            const entero = parseInt(partes[0]);
            const decimal = parseInt(partes[1]);

            if (entero === 0) return 'CERO LEMPIRAS CON ' + decimal + '/100';

            let resultado = '';
            
            const miles = Math.floor(entero / 1000);
            if (miles > 0) resultado += convertirMiles(miles);

            const centena = entero % 1000;
            if (centena > 0) {
                resultado += convertirCentenas(centena);
                const decena = centena % 100;
                resultado += convertirDecenas(decena);
            }

            resultado += 'LEMPIRAS CON ' + decimal + '/100';
            return resultado.trim();
        };

        console.log('Creando documento PDF...');
        const doc = new PDFDocument({
            size: [227, 800],
            margin: 10,
            bufferPages: true
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=factura_${id_venta}.pdf`);
        doc.pipe(res);

        const printLineItem = (text, value) => {
            const xText = 10;
            const xValue = 170;
            const y = doc.y;
            
            doc.text(text, xText, y, { align: 'left' });
            if (typeof value === 'number') {
                doc.text(value.toFixed(2), xValue, y, { align: 'right' });
            } else {
                doc.text(value.toString(), xValue, y, { align: 'right' });
            }
            doc.moveDown(0.5);
        };

        // Encabezado
        doc.font('Helvetica-Bold')
            .fontSize(16)
            .text(empresa.nombre, { align: 'center' })
            .fontSize(12)
            .text('Casa Matriz', { align: 'center' })
            .text(sucursal.direccion, { align: 'center' })
            .text(`Tel: ${empresa.telefono_principal}`, { align: 'center' })
            .text(`Email: ${empresa.correo_principal}`, { align: 'center' })
            .moveDown(0.5);


            //Informacion Factura
            doc.font('Helvetica')
            .fontSize(8)
            .text(`Sucursal: ${sucursal.nombre_administrativo}`)
            .text(`Factura: ${venta.facturas[0].factura_SAR[0].numero_factura_SAR}`)
            .text(`Fecha Emisión: ${format(new Date(venta.created_at), 'dd-MM-yyyy HH:mm:ss')}`)
            .text(`Cajer@: ${venta.Usuarios.nombre} ${venta.Usuarios.apellido}`) // Agregamos el cajero
            .text(`Cliente: ${venta.Clientes?.nombre_completo || 'Consumidor Final'}`)
            .text(`R.T.N: ${venta.Clientes?.rtn || '00000000000000'}`)
            .moveDown(0.5);

          // Encabezados de la tabla
        const startY = doc.y;
        doc.font('Helvetica-Bold')
            .text('Cant.', 10, startY, { width: 25 })
            .text('Nombre', 35, startY, { width: 130 })
            .text('Precio', 165, startY, { width: 40, align: 'right' })
            .text('T', 205, startY, { width: 12, align: 'center' });

        // Línea separadora
        doc.moveTo(10, doc.y + 0).lineTo(217, doc.y + 0).stroke();
        doc.moveDown(0.3);

        // Productos
        doc.font('Helvetica');
        detalles.forEach(item => {
            const y = doc.y;
            const total = item.total_detalle;
            const tipo = item.producto.impuesto > 0 ? 'G' : 'E';
            
            doc.text(item.cantidad.toString(), 10, y, { width: 25 })
                .text(item.producto.nombre, 35, y, { width: 130 })
                .text(total.toFixed(2), 165, y, { width: 40, align: 'right' })
                .text(tipo, 205, y, { width: 12, align: 'center' });
                doc.moveDown();
        });

      // Línea separadora
      doc.moveTo(10, doc.y + 5).lineTo(217, doc.y + 5).stroke();
      doc.moveDown();
      
           

        printLineItem('IMPORTE EXONERADO:', venta.facturas[0].total_extento);
        printLineItem('IMPORTE GRAVADO 15%:', venta.facturas[0].gravado_15);
        printLineItem('IMPORTE GRAVADO 18%:', venta.facturas[0].gravado_18);
        printLineItem('Rebajas y Descuento:', venta.facturas[0].descuento);
        printLineItem('ISV 15%:', venta.facturas[0].ISV_15);
        printLineItem('ISV 18%:', venta.facturas[0].ISV_18);

        // Total y datos de pago
        doc.font('Helvetica-Bold')
            .text('Total:', 10)
            .text(venta.facturas[0].total.toFixed(2), 170, doc.y - 12, { align: 'right' })
            .font('Helvetica')
            .moveDown();

        // Tipo de pago, efectivo y cambio
        doc.font('Helvetica');
        printLineItem('Tipo de Pago:', venta.facturas[0].tipo_factura);
        printLineItem('Efectivo:', venta.facturas[0].pago);
        printLineItem('Cambio:', venta.facturas[0].cambio);

        // Resto del documento
        doc.text(' ', 10)
            .moveDown(0.5)
            .text(numeroALetras(venta.facturas[0].total), { align: 'center' })
            .moveDown()
            .moveDown()
            .text('No. de Orden de Compra Exenta:', { align: 'center' })
            .text('No. Constancia de Registro de Exonerados:', { align: 'center' })
            .text('No. Registro de SAG:', { align: 'center' })
            .moveDown()
            .text(`CAI: ${venta.facturas[0].factura_SAR[0].numero_CAI}`, { align: 'center' })
            .text(`Rango Facturación: ${datosSAR.rango_inicial} A ${datosSAR.rango_final}`, { align: 'center' })
            .text(`Fecha Límite de Emisión: ${format(new Date(datosSAR.fecha_vencimiento), 'dd-MM-yyyy')}`, { align: 'center' })
            .moveDown()
            .font('Helvetica-Bold')
            .text('LA FACTURA ES BENEFICIO DE TODOS,', { align: 'center' })
            .text('EXIJALA', { align: 'center' });

        console.log('Finalizando documento...');
        doc.end();
        console.log('Documento PDF generado exitosamente');

    } catch (error) {
        console.error('Error en la generación de la factura:', error);
        res.status(500).json({
            error: 'Error al generar la factura',
            details: error.message,
            stack: error.stack
        });
    }
};



module.exports = { 
    getPrePage, 
    getProductPage,
    getVentaPendiente,
    verificarRtn, 
    selectProductoCodigo, 
    guardarVenta, 
    getVentasGuardadas, 
    recuperarVentaGuardada, 
    postVenta,
    eliminarVenta,
    pagarFacturaEfectivo, 
    eliminarProductoVenta, 
    crearCajaUsuario,
    cajaAbiertaUsuario,
    cerrarCajaUsuario,
    generarFactura,
    
    ////promociones
    pruebaPromos

}