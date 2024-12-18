const { getSucursalesbyUser } = require('../db/sucursalUsuarioSvc');
const { 
    buscarProductoInventario, 
    postFirstinventario,
    aumentarInventario,
    addInventarioRollBack
} = require('../db/inventarioSvc');

const { necesitaAlertStockMax, necesitaAlertStockMin } = require('../db/alerts.js');

const { getEmpresaId } = require('../db/empresaSvc');

// Función auxiliar para obtener el ID de usuario
const getUserId = (req) => {
    const id = req.user?.id || req.user?.id_usuario;
    if (!id) {
        throw new Error('Usuario no autenticado');
    }
    return id;
};

const obtenerProductos = async (req, res) => {
    const { supabase } = req;

    try {
        const id_usuario = getUserId(req);
      //  console.log('1. ID de usuario recibido:', id_usuario);

        // Verificar que tenemos el objeto supabase
        if (!supabase) {
            throw new Error('Error de configuración del servidor');
        }

        const id_empresa = await getEmpresaId(id_usuario, supabase);
     //   console.log('2. ID empresa obtenido:', id_empresa);

        const { data: productos, error } = await supabase
            .from('producto')
            .select(`
                id_producto,
                codigo_producto,
                nombre,
                descripcion,
                precio_unitario,
                id_proveedor,
                estado,
                proveedor:id_proveedor (
                    nombre
                )
            `)
            .eq('id_empresa', id_empresa)
            .eq('estado', true);

        if (error) {
            throw new Error('Error al obtener productos');
        }

        res.json(productos);

    } catch (error) {
        console.error('Error en obtenerProductos:', error);
        res.status(error.message === 'Usuario no autenticado' ? 401 : 500).json({
            success: false,
            message: error.message || 'Error al obtener los productos'
        });
    }
};


const registrarCompra = async (req, res) => {
    const { productosLista, total, referenciaPago } = req.body;
    const { supabase } = req;

    try {
        const id_usuario = getUserId(req);
        // console.log('1. Iniciando registro de compra para usuario:', id_usuario);
        // console.log('2. Datos recibidos:', { productosLista, total, referenciaPago });
        
        if (!Array.isArray(productosLista) || productosLista.length === 0) {
            throw new Error('Lista de productos inválida');
        }

        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);
        // console.log('3. ID Sucursal obtenida:', id_sucursal);

        const { data: productoInfo, error: errorProducto } = await supabase
            .from('producto')
            .select('id_producto, id_proveedor')
            .eq('codigo_producto', productosLista[0].codigo)
            .single();

    //    console.log('4. Info del producto:', productoInfo);

        if (errorProducto || !productoInfo) {
            console.error('Error al obtener información del producto:', errorProducto);
            throw new Error('Error al obtener información del producto');
        }

        const id_proveedor = productoInfo.id_proveedor;
        if (!id_proveedor) {
            throw new Error('Producto no tiene proveedor asignado');
        }

        // Manejamos el caso de referenciaPago undefined o null
        const referenciaFinal = referenciaPago || '';

        const compraData = {
            id_usuario: Number(id_usuario),
            id_sucursal: Number(id_sucursal),
            id_proveedor: Number(id_proveedor),
            total: Number(total),
            estado_pago: 'PAGADO',
            metodo_pago: 'EFECTIVO',
            referencia_pago: referenciaFinal // Usamos el valor por defecto si es undefined
        };

       // console.log('5. Datos de compra a insertar:', compraData);

        const { data: compra, error: errorCompra } = await supabase
            .from('Compras')
            .insert(compraData)
            .select('id_compra')
            .single();

        if (errorCompra) {
            console.error('6. Error al insertar compra:', errorCompra);
            throw new Error(`Error al registrar la compra: ${errorCompra.message}`);
        }

     //   console.log('7. Compra registrada exitosamente:', compra);

        // Procesar productos
        for (const producto of productosLista) {
            console.log('8. Procesando producto:', producto);

            // Obtener el id_producto real
            const { data: productoActual, error: errorProductoActual } = await supabase
                .from('producto')
                .select('id_producto, nombre')
                .eq('codigo_producto', producto.codigo)
                .single();

            if (errorProductoActual || !productoActual) {
                throw new Error(`No se encontró el producto con código ${producto.codigo}`);
            }

          //  console.log('9. Producto encontrado:', productoActual);

            const cantidadUnitaria = Number(producto.cantidad) || 1;
            const cantidadPaquetes = Number(producto.paquetes) || 1;
            const cantidadTotal = cantidadUnitaria * cantidadPaquetes;

            // console.log('10. Cantidades calculadas:', {
            //     cantidadUnitaria,
            //     cantidadPaquetes,
            //     cantidadTotal
            // });

            // Buscar o crear inventario
            let inventario = await buscarProductoInventario(productoActual.id_producto, id_sucursal, supabase);
            
            if (!inventario) {
                console.log('11. Creando nuevo inventario para producto:', productoActual.id_producto);
                try {
                    const { data: nuevoInventario, error: errorInventario } = await supabase
                        .from('inventarios')
                        .insert({
                            id_producto: productoActual.id_producto,
                            id_sucursal: id_sucursal,
                            stock_actual: 0,
                            stock_min: 0,
                            stock_max: 1000,
                            estado: true
                        })
                        .select('*')
                        .single();

                    if (errorInventario) {
                        console.error('Error al crear inventario:', errorInventario);
                        throw new Error(`Error al crear inventario en BD: ${errorInventario.message}`);
                    }

                    inventario = nuevoInventario;
                    console.log('12. Nuevo inventario creado:', inventario);
                } catch (errorInventario) {
                    console.error('Error detallado:', errorInventario);
                    throw new Error(`Error al crear inventario: ${errorInventario.message}`);
                }
            }

            // Registrar en Compras_detalles
            const detalleData = {
                id_compra: compra.id_compra,
                id_producto: productoActual.id_producto,
                cantidad: cantidadTotal,
                precio_compra: Number(producto.total_compra) / cantidadTotal,
                total_detalle: Number(producto.total_compra)
            };

          //  console.log('13. Registrando detalle de compra:', detalleData);

            const { error: errorDetalle } = await supabase
                .from('Compras_detalles')
                .insert(detalleData);

            if (errorDetalle) {
                console.error('Error en detalle:', errorDetalle);
                throw new Error('Error al registrar detalle de compra');
            }

            try {
           //     console.log('14. Actualizando stock del inventario');
                await aumentarInventario(inventario, cantidadTotal, supabase);
                 necesitaAlertStockMax(productoActual, id_usuario, supabase);
                 necesitaAlertStockMin(productoActual, id_usuario, supabase);
                
           //     console.log('15. Stock actualizado correctamente');
            } catch (errorStock) {
                console.error('Error al aumentar stock:', errorStock);
                throw new Error(`Error al actualizar stock: ${errorStock.message}`);
            }

            // Registrar en rollback
         //   console.log('16. Registrando en rollback');
            await addInventarioRollBack(inventario.id_inventario, id_usuario, cantidadTotal, supabase);
         //   console.log('17. Rollback registrado exitosamente');
        }
//
     //   console.log('18. Proceso completado exitosamente');
        
        res.status(200).json({
            success: true,
            message: 'Compra registrada exitosamente',
            data: { id_compra: compra.id_compra }
        });

    } catch (error) {
        console.error('Error completo en registrarCompra:', error);
        res.status(error.message === 'Usuario no autenticado' ? 401 : 500).json({
            success: false,
            message: error.message || 'Error al procesar la compra',
            details: error.details || undefined
        });
    }
};

const obtenerCompras = async (req, res) => {
    const { supabase } = req;

    try {
        const id_usuario = getUserId(req);
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

        const { data: compras, error } = await supabase
            .from('compras')
            .select(`
                *,
                compras_detalles (
                    *,
                    producto:id_producto (nombre)
                )
            `)
            .eq('id_sucursal', id_sucursal)
            .order('created_at', { ascending: false });

        if (error) throw new Error('Error al obtener las compras');

        res.status(200).json({
            success: true,
            data: compras
        });

    } catch (error) {
        console.error('Error en obtenerCompras:', error);
        res.status(error.message === 'Usuario no autenticado' ? 401 : 500).json({
            success: false,
            message: error.message || 'Error al obtener las compras'
        });
    }
};

const obtenerDetalleCompra = async (req, res) => {
    const { id_compra } = req.params;
    const { supabase } = req;

    try {
        // Verificamos autenticación aunque no usemos el ID
        getUserId(req);

        const { data: detalles, error } = await supabase
            .from('compras_detalles')
            .select(`
                *,
                producto:id_producto (
                    nombre,
                    codigo_producto
                )
            `)
            .eq('id_compra', id_compra);

        if (error) throw new Error('Error al obtener los detalles de la compra');

        res.status(200).json({
            success: true,
            data: detalles
        });

    } catch (error) {
        console.error('Error en obtenerDetalleCompra:', error);
        res.status(error.message === 'Usuario no autenticado' ? 401 : 500).json({
            success: false,
            message: error.message || 'Error al obtener los detalles de la compra'
        });
    }
};

module.exports = {
    obtenerProductos,
    registrarCompra,
    obtenerCompras,
    obtenerDetalleCompra
};