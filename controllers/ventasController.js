const { getSucursalesbyUser } = require('../db/sucursalUsuarioSvc.js');
const { format } = require('date-fns');

const getPrePage = async (req, res) => {
    const supabase = req.supabase;
    try {
        const id_usuario = req.params.id_usuario;
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

        const { data: sucursal, error } = await supabase.from('Sucursales')
        .select('nombre_administrativo')
        .eq('id_sucursal', id_sucursal)
        .single();

        console.log(sucursal);

        const { data: usuario, errorUser } = await supabase.from('Usuarios')
        .select('nombre, apellido')
        .eq('id_usuario', id_usuario)
        .single();

        console.log(usuario);

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
        .gt('stock_actual', 0 );

        if(error){
            console.error('Error al obtener los datos de la tabla:', error.message);
            throw new Error('Ocurrió un error al obtener datos de la tabla inventario.');
        }

        let arrayProductos = [];

        for (const producto of inventarios){
            const { data: p, errorProducto } = await supabase.from('producto')
            .select('id_producto, nombre, precio_unitario')
            .eq('id_producto', producto.id_producto)
            .single();

            if(errorProducto){
                console.error('Error al obtener los datos de la tabla:', errorProducto.message);
                throw new Error('Ocurrió un error al obtener datos de la tabla inventario.');
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

    try {
        
        const { data: producto, error } = await supabase.from('producto')
        .select('id_producto, nombre, precio_unitario')
        .eq('codigo_producto', codigoProducto)
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
        estado

     } = req.body;

     try {
        const { data: venta, error } = await supabase.from('Ventas')
        .insert({
           id_cliente: id_cliente,
           id_sucursal: id_sucursal,
           id_usuario: id_usuario,
           estado: estado,
           descuento: 0, 
           sub_total: 0
        }).select('id_venta');
   
        if(error){
           console.error('Error al obtener los datos de la tabla:', error.message);
           throw new Error('Ocurrió un error al obtener datos de la tabla producto.');
        }

        // const id_venta = venta.id_venta[0];
        // console.log(id_venta); 
        res.status(200).json(venta);
   
     } catch (error) {
        res.status(500).json({
            error: error.message
        });
     }
  }

module.exports = { getPrePage, getProductPage, verificarRtn, getProductobyCodigo, postVenta }