const { getSucursalesbyUser, getDatosSarSucursal, verificarPasswordAdmin } = require('../db/sucursalUsuarioSvc.js');
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
            const precioImpuesto = calculos.impuestoProducto(p.precio_unitario, p.impuesto);
            p.precioDescuento = precioImpuesto * descuento;
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
    const { id_producto, passwordTry } = req.body;
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

        const {resultado: resultadoPassword} = await verificarPasswordAdmin(id_sucursal, passwordTry, supabase);

        if(!resultadoPassword){
            throw 'Contraseña incorrecta.';
        }
        console.log(resultadoPassword);

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

 const pagarFacturaTransferencia = async (req, res) => {
    const supabase = req.supabase;
    const { pago, id_venta, id_usuario, descripcion } = req.body;

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
            tipo_factura: "Transferencia",
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
    const { id_usuario, dineroCaja } = req.body;
    try {
        const date = new Date();
        const closed_at = date.toISOString();

        const {resultado, caja} = await calculos.existeCaja(id_usuario, supabase);
        
        if(!resultado){
           return res.status(500).json({
                respuesta: 'Este usuario no tiene una caja abierta aun.'
            });
        }

        // Guardamos el valor_actual antes de cerrar la caja
        const valorSistema = caja.valor_actual;

        const { data: cajaCerrada, error } = await supabase
        .from('caja')
        .update({
            abierto: false,
            closed_at: closed_at,
            dinerocaja: dineroCaja,
            valor_actual: valorSistema // Mantenemos el valor_actual
        })
        .eq('id_caja', caja.id_caja)
        .select('id_caja, created_at, closed_at, valor_inicial, valor_actual, dinerocaja')
        .single();

        if(error){
            console.error('Ocurrio un error al cerrar caja', error);
            throw 'No se cerro la caja, intentelo mas tarde';
        }

        if(!cajaCerrada) {
            throw 'No se pudo obtener la información de la caja cerrada';
        }

        // Pasamos el valor_actual al reporte
        const reporteCaja = await calculos.reporteCaja(cajaCerrada, supabase, valorSistema);

        res.status(200).json(reporteCaja);

    } catch (error) {
        console.error('Ocurrio un error: ', error);
        res.status(500).json({
            error: error
        });
    }
};

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

    const formatNumeroFactura = (numero) => {
        const formatted = `${numero.slice(0, 3)}-${numero.slice(3, 6)}-${numero.slice(6, 8)}-${numero.slice(8)}`;
        return formatted;
    };

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
  
    try {
        if (!id_venta || !id_usuario) {
            throw new Error('Parámetros incompletos');
        }

        // Verificar si la venta existe
        const { data: ventaBasica, error: ventaBasicaError } = await supabase
            .from('Ventas')
            .select('*')
            .eq('id_venta', id_venta)
            .single();

        if (ventaBasicaError) {
            console.error('Error al verificar la venta:', ventaBasicaError);
            throw new Error(`No se encontró la venta con ID: ${id_venta}`);
        }

        // Obtener la factura y datos SAR
        const { data: factura, error: facturaError } = await supabase
            .from('facturas')
            .select('*, factura_SAR (*)')
            .eq('id_venta', id_venta)
            .single();

        if (facturaError) {
            console.error('Error al obtener factura:', facturaError);
            throw new Error('Error al obtener datos de factura');
        }

        // Obtener datos del cliente
        const { data: cliente, error: clienteError } = await supabase
            .from('Clientes')
            .select('*')
            .eq('id_cliente', ventaBasica.id_cliente)
            .single();

        if (clienteError) {
            console.log('Cliente no encontrado, se usará Consumidor Final');
        }

        // Obtener datos del usuario
        const { data: usuario, error: usuarioError } = await supabase
            .from('Usuarios')
            .select('nombre, apellido')
            .eq('id_usuario', ventaBasica.id_usuario)
            .single();

        if (usuarioError) {
            console.error('Error al obtener usuario:', usuarioError);
            throw new Error('Error al obtener datos del usuario');
        }

        // Obtener datos de sucursal y empresa
        const { data: sucursal, error: sucursalError } = await supabase
            .from('Sucursales')
            .select(`
                *,
                Empresas!Sucursales_id_empresa_fkey (
                    nombre,
                    telefono_principal,
                    correo_principal,
                    direccion,
                    usa_SAR
                )
            `)
            .eq('id_sucursal', ventaBasica.id_sucursal)
            .single();

        if (sucursalError) {
            console.error('Error al obtener sucursal:', sucursalError);
            throw new Error('Error al obtener datos de sucursal');
        }

        const empresa = sucursal.Empresas;

        // Obtener detalles de la venta
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

        // Obtener datos SAR si la empresa lo usa
        let datosSAR = null;
        if (empresa.usa_SAR) {
            const { data: sarData, error: sarError } = await supabase
                .from('Datos_SAR')
                .select(`
                    rango_inicial,
                    rango_final,
                    fecha_vencimiento
                `)
                .eq('id_sucursal', ventaBasica.id_sucursal)
                .single();

            if (sarError) {
                console.log('No hay registro válido de la sucursal en SAR');
            }
            datosSAR = sarData;
        }

        // Crear documento PDF
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
            .fontSize(12)
            .text(empresa.nombre, { align: 'center' })
            .fontSize(8)
            .text(empresa.direccion, { align: 'center' })
            .text(`Tel: ${empresa.telefono_principal}`, { align: 'center' })
            .text(`Email: ${empresa.correo_principal}`, { align: 'center' })
            .moveDown(0.5);

        // Información Factura
        doc.font('Helvetica')
            .fontSize(8)
            .text(`Sucursal: ${sucursal.nombre_administrativo}`)
            .text(`Factura: ${empresa.usa_SAR ? 
                formatNumeroFactura(factura.factura_SAR[0].numero_factura_SAR) : 
                factura.codigo_factura}`)
            .text(`Fecha Emisión: ${format(new Date(ventaBasica.created_at), 'dd-MM-yyyy HH:mm:ss')}`)
            .text(`Cajer@: ${usuario.nombre} ${usuario.apellido}`)
            .text(`Cliente: ${cliente?.nombre_completo || 'Consumidor Final'}`)
            .text(`R.T.N: ${cliente?.rtn || '00000000000000'}`)
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

        // Totales
        printLineItem('IMPORTE EXONERADO:', factura.total_extento);
        printLineItem('IMPORTE GRAVADO 15%:', factura.gravado_15);
        printLineItem('IMPORTE GRAVADO 18%:', factura.gravado_18);
        printLineItem('Rebajas y Descuento:', factura.descuento);
        printLineItem('ISV 15%:', factura.ISV_15);
        printLineItem('ISV 18%:', factura.ISV_18);

        // Total y datos de pago
        doc.font('Helvetica-Bold')
            .text('Total:', 10)
            .text(factura.total.toFixed(2), 170, doc.y - 12, { align: 'right' })
            .font('Helvetica')
            .moveDown();

        printLineItem('Tipo de Pago:', factura.tipo_factura);
        printLineItem('Efectivo:', factura.pago);
        printLineItem('Cambio:', factura.cambio);

        // Total en letras y datos adicionales
        doc.text(' ', 10)
            .moveDown(0.5)
            .text(numeroALetras(factura.total), { align: 'center' })
            .moveDown()
            .moveDown()
            .text('No. de Orden de Compra Exenta:', { align: 'center' })
            .text('No. Constancia de Registro de Exonerados:', { align: 'center' })
            .text('No. Registro de SAG:', { align: 'center' })
            .moveDown();

        // Información SAR (solo si usa_SAR es true)
        if (empresa.usa_SAR && datosSAR) {
            doc.text(`CAI: ${factura.factura_SAR[0].numero_CAI}`, { align: 'center' })
                .text(`Rango Facturación: ${formatNumeroFactura(datosSAR.rango_inicial)} A ${formatNumeroFactura(datosSAR.rango_final)}`, { align: 'center' })
                .text(`Fecha Límite de Emisión: ${format(new Date(datosSAR.fecha_vencimiento), 'dd-MM-yyyy')}`, { align: 'center' })
                .moveDown()
                .font('Helvetica-Bold')
                .text('LA FACTURA ES BENEFICIO DE TODOS,', { align: 'center' })
                .text('EXIJALA', { align: 'center' });
        }

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
const generarPDFCierreCaja = async (req, res) => {
    try {
        const reporte = req.body;
        const doc = new PDFDocument({
            size: [227, 800],
            margin: 15
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=cierre_caja.pdf');
        
        doc.pipe(res);
        
        const anchoDisponible = 197;
        const anchoMitad = anchoDisponible / 2;
        
        // Título
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .text('REPORTE DE CIERRE DE CAJA', {
               align: 'center',
               width: anchoDisponible
           })
           .moveDown(0.5);
        
        // Línea separadora
        doc.moveTo(15, doc.y)
           .lineTo(212, doc.y)
           .stroke()
           .moveDown(0.5);
        
        // Información básica
        doc.fontSize(8)
           .text(`Fecha Apertura: ${reporte.fechaInicio}`, {
               width: anchoDisponible,
               align: 'left'
           })
           .text(`Fecha Cierre: ${reporte.fechaFinal}`, {
               width: anchoDisponible,
               align: 'left'
           })
           .moveDown(0.5);
        
        const formatCurrency = (amount) => {
            return `L. ${Number(amount).toFixed(2)}`;
        };
        
        // Función para agregar línea de detalle
        const agregarLineaDetalle = (label, value) => {
            doc.font('Helvetica')
               .text(label, {
                   continued: false,
                   width: anchoDisponible * 0.6,
                   align: 'left'
               });
            
            doc.text(value, {
                width: anchoDisponible * 0.4,
                align: 'right',
                y: doc.y - doc.currentLineHeight()
            });
            
            doc.moveDown(0.2);
        };
        
        // Resumen de ventas
        doc.font('Helvetica-Bold')
           .text('RESUMEN DE VENTAS:', {
               width: anchoDisponible,
               align: 'center'
           })
           .moveDown(0.5);
        
        // Agregar detalles de ventas
        [
            ['Total Efectivo:', formatCurrency(reporte.totalEfectivo)],
            ['Total Transferencia:', formatCurrency(reporte.totalTarjeta)],
            ['Total ISV 15%:', formatCurrency(reporte.totalIsv15)],
            ['Total ISV 18%:', formatCurrency(reporte.totalIsv18)],
            ['Total Gravado 15%:', formatCurrency(reporte.totalGravado15)],
            ['Total Gravado 18%:', formatCurrency(reporte.totalGravado18)],
            ['Total Exento:', formatCurrency(reporte.totalExtento)]
        ].forEach(([label, value]) => {
            agregarLineaDetalle(label, value);
        });
        
        // Línea separadora
        doc.moveDown(0.5)
           .moveTo(15, doc.y)
           .lineTo(212, doc.y)
           .stroke()
           .moveDown(0.5);
        
        // Cuadre de caja
        doc.font('Helvetica-Bold')
           .text('CUADRE DE CAJA:', {
               width: anchoDisponible,
               align: 'center'
           })
           .moveDown(0.5);
        
        // Calcular la diferencia
        const diferencia = reporte.dineroDeclarado - reporte.total_sistema;
        const haySobrante = diferencia > 0;
        const hayFaltante = diferencia < 0;
        
        [
            ['Total Sistema:', formatCurrency(reporte.total_sistema)],
            ['Total en Caja:', formatCurrency(reporte.dineroDeclarado)],
            ...(haySobrante ? [['Sobrante:', formatCurrency(diferencia)]] : []),
            ...(hayFaltante ? [['Faltante:', formatCurrency(Math.abs(diferencia))]] : []),
            ...(!haySobrante && !hayFaltante ? [['Estado:', 'Cuadrado']] : [])
        ].forEach(([label, value]) => {
            agregarLineaDetalle(label, value);
        });
        
        // Línea separadora
        doc.moveDown(0.5)
           .moveTo(15, doc.y)
           .lineTo(212, doc.y)
           .stroke()
           .moveDown(0.5);
        
        // Firmas una al lado de la otra
        doc.moveDown(2);
        
        // Guardar la posición Y actual
        const yPosicion = doc.y;
        
        // Primera firma (izquierda)
        doc.fontSize(8)
           .text('_________________', {
               width: anchoMitad,
               align: 'center',
               continued: false
           })
           .text('Firma del Cajero', {
               width: anchoMitad,
               align: 'center'
           });
        
        // Segunda firma (derecha)
        doc.y = yPosicion; // Volver a la misma altura
        doc.x = anchoMitad + 15; // Mover a la mitad derecha
        doc.text('_________________', {
               width: anchoMitad,
               align: 'center',
               continued: false
           })
           .text('Firma del Supervisor', {
               width: anchoMitad,
               align: 'center'
           });
        
        // Fecha y hora de impresión
        doc.x = 15; // Resetear posición X
        doc.moveDown(2)
           .fontSize(6)
           .text(`Impreso: ${new Date().toLocaleString('es-HN')}`, {
               align: 'center',
               width: anchoDisponible
           });
        
        doc.end();
        
    } catch (error) {
        console.error('Error en generarPDFCierreCaja:', error);
        res.status(500).json({
            error: 'Error al generar el PDF',
            details: error.message
        });
    }
};

  // Nueva ruta para obtener totales de caja
  const getTotalesCaja = async(req, res) => {
    console.log('Iniciando getTotalesCaja...');
    const supabase = req.supabase;
    const id_usuario = req.params.id_usuario;
    console.log('ID de usuario recibido:', id_usuario);
    
    try {
        // Verificar existencia de caja
        console.log('Verificando existencia de caja...');
        const {resultado, caja} = await calculos.existeCaja(id_usuario, supabase);
        console.log('Resultado existeCaja:', { resultado, caja });
        
        if(!resultado){
            console.log('No se encontró caja abierta para el usuario');
            return res.status(500).json({
                respuesta: 'Este usuario no tiene una caja abierta.'
            });
        }

        console.log('Caja encontrada con ID:', caja.id_caja);

        // Obtener ventas
        console.log('Consultando ventas de la caja actual...');
        const { data: ventas, error } = await supabase
        .from('Ventas')
        .select(`
            id_venta,
            facturas (
                tipo_factura,
                total
            )
        `)
        .eq('id_caja', caja.id_caja);

        if(error) {
            console.error('Error al consultar ventas:', error);
            throw error;
        }

        console.log('Ventas encontradas:', ventas.length);
        console.log('Detalle de ventas:', JSON.stringify(ventas, null, 2));

        let totalEfectivo = 0;
        let totalTransferencia = 0;

        // Calcular totales
        console.log('Calculando totales...');
        ventas.forEach(venta => {
            if (venta.facturas) {
                venta.facturas.forEach(factura => {
                    console.log('Procesando factura:', {
                        tipo: factura.tipo_factura,
                        total: factura.total
                    });

                    if (factura.tipo_factura === 'Efectivo') {
                        totalEfectivo += factura.total;
                        console.log('Sumando a efectivo:', factura.total, 'Total acumulado:', totalEfectivo);
                    } else if (factura.tipo_factura === 'Transferencia') {
                        totalTransferencia += factura.total;
                        console.log('Sumando a transferencia:', factura.total, 'Total acumulado:', totalTransferencia);
                    }
                });
            }
        });

        console.log('Totales finales:', {
            totalEfectivo,
            totalTransferencia
        });

        res.status(200).json({
            totalEfectivo,
            totalTransferencia
        });

        console.log('Respuesta enviada exitosamente');

    } catch (error) {
        console.error('Error en getTotalesCaja:', error);
        console.error('Stack del error:', error.stack);
        res.status(500).json({
            error: error.message
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
    pagarFacturaTransferencia,
    eliminarProductoVenta, 
    crearCajaUsuario,
    cajaAbiertaUsuario,
    cerrarCajaUsuario,
    generarFactura,
    generarPDFCierreCaja,
    getTotalesCaja,
    verificarPasswordAdmin,
    ////promociones
    pruebaPromos

}