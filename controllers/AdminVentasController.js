const { getSucursalesbyUser, getDatosSarSucursal } = require('../db/sucursalUsuarioSvc');

const obtenerVentas = async (req, res) => {
    const { supabase } = req;

    try {
        const id_usuario = req.user?.id || req.user?.id_usuario;
        if (!id_usuario) {
            throw new Error('Usuario no autenticado');
        }

        // Obtener la sucursal del usuario
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);
        console.log('1. Sucursal obtenida:', id_sucursal);

        // Obtener todas las ventas de una vez
        const { data: ventas, error: errorVentas } = await supabase
            .from('Ventas')
            .select(`
                id_venta,
                created_at,
                sub_total,
                estado,
                id_usuario,
                Usuarios (
                    nombre,
                    apellido
                ),
                Clientes (
                    nombre_completo
                )
            `)
            .eq('id_sucursal', id_sucursal)
            .eq('estado', 'Pagada')
            .order('id_venta', { ascending: true });

        if (errorVentas) throw new Error('Error al obtener las ventas');

        // Obtener todas las facturas de una vez
        const { data: facturas, error: errorFacturas } = await supabase
            .from('facturas')
            .select('*')
            .in('id_venta', ventas.map(v => v.id_venta));

        if (errorFacturas) throw new Error('Error al obtener las facturas');

        // Obtener todos los datos SAR de una vez
        const { data: sarData, error: errorSAR } = await supabase
            .from('factura_SAR')
            .select('numero_factura_SAR, numero_CAI, id_factura')
            .in('id_factura', facturas.map(f => f.id_factura));

        if (errorSAR) throw new Error('Error al obtener datos SAR');

        // Crear mapas para búsqueda rápida
        const facturasMap = facturas.reduce((acc, factura) => {
            acc[factura.id_venta] = factura;
            return acc;
        }, {});

        const sarMap = sarData.reduce((acc, sar) => {
            acc[sar.id_factura] = sar;
            return acc;
        }, {});

        // Formatear ventas en una sola pasada
        const ventasFormateadas = ventas.map(venta => {
            const facturaData = facturasMap[venta.id_venta];
            const sarInfo = facturaData ? sarMap[facturaData.id_factura] : null;

            return {
                codigo: sarInfo?.numero_factura_SAR || 'N/A',
                nombre: venta.Usuarios ? `${venta.Usuarios.nombre} ${venta.Usuarios.apellido}` : 'N/A',
                cliente: venta.Clientes ? venta.Clientes.nombre_completo : 'Consumidor Final',
                subtotal: venta.sub_total || 0,
                descuento: facturaData?.descuento || 0,
                total: facturaData?.total || 0,
                total_impuesto: facturaData ? (facturaData.ISV_15 || 0) + (facturaData.ISV_18 || 0) : 0,
                fechaHora: venta.created_at,
                numero_factura: sarInfo?.numero_factura_SAR || 'N/A',
                cai: sarInfo?.numero_CAI || 'N/A',
                id_venta: venta.id_venta,
                id_factura: facturaData?.id_factura
            };
        }).filter(v => v !== null);

        res.status(200).json({
            success: true,
            data: ventasFormateadas,
            message: 'Ventas obtenidas exitosamente'
        });

    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(error.message === 'Usuario no autenticado' ? 401 : 500).json({
            success: false,
            message: error.message || 'Error al obtener las ventas'
        });
    }
};


const obtenerDetalleVenta = async (req, res) => {
    const { id_venta } = req.params;
    const { supabase } = req;

    try {
        const id_usuario = req.user?.id || req.user?.id_usuario;
        if (!id_usuario) {
            throw new Error('Usuario no autenticado');
        }

        // Realizar todas las consultas en paralelo
        const [
            ventaResult,
            facturaResult,
            detallesResult
        ] = await Promise.all([
            // Consulta de venta
            supabase
                .from('Ventas')
                .select(`
                    id_venta,
                    created_at,
                    sub_total,
                    estado,
                    Usuarios (
                        nombre,
                        apellido
                    ),
                    Clientes (
                        nombre_completo,
                        rtn
                    )
                `)
                .eq('id_venta', id_venta)
                .single(),

            // Consulta de factura
            supabase
                .from('facturas')
                .select('*')
                .eq('id_venta', id_venta)
                .single(),

            // Consulta de detalles y productos
            supabase
                .from('ventas_detalles')
                .select(`
                    cantidad,
                    descuento,
                    total_detalle,
                    productos:id_producto (
                        nombre,
                        codigo_producto,
                        descripcion
                    )
                `)
                .eq('id_venta', id_venta)
        ]);

        // Verificar errores de las consultas principales
        if (ventaResult.error) throw new Error('Venta no encontrada');
        if (facturaResult.error) throw new Error('Error al obtener detalles de la factura');
        if (detallesResult.error) throw new Error('Error al obtener detalles de los productos');

        const venta = ventaResult.data;
        const factura = facturaResult.data;
        const detallesProductos = detallesResult.data;

        // Si hay factura, obtener datos SAR
        let sarData = null;
        if (factura) {
            const { data: sar } = await supabase
                .from('factura_SAR')
                .select('numero_factura_SAR, numero_CAI')
                .eq('id_factura', factura.id_factura)
                .single();
            sarData = sar;
        }

        // Formatear respuesta
        const detalleVenta = {
            codigo: venta.id_venta,
            nombre: `${venta.Usuarios.nombre} ${venta.Usuarios.apellido}`,
            cliente: venta.Clientes?.nombre_completo || 'Consumidor Final',
            rtnCliente: venta.Clientes?.rtn || 'N/A',
            subtotal: venta.sub_total || 0,
            descuento: factura?.descuento || 0,
            total: factura?.total || 0,
            total_impuesto: factura ? (factura.ISV_15 || 0) + (factura.ISV_18 || 0) : 0,
            fechaHora: venta.created_at,
            numero_factura: sarData?.numero_factura_SAR || 'N/A',
            cai: sarData?.numero_CAI || 'N/A',
            estado: venta.estado,
            productos: detallesProductos.map(detalle => ({
                nombre: detalle.productos.nombre,
                codigo: detalle.productos.codigo_producto,
                descripcion: detalle.productos.descripcion,
                cantidad: detalle.cantidad,
                descuento: detalle.descuento || 0,
                precio_unitario: detalle.total_detalle / detalle.cantidad,
                total: detalle.total_detalle
            }))
        };

        res.status(200).json({
            success: true,
            data: detalleVenta,
            message: 'Detalles de venta obtenidos exitosamente'
        });

    } catch (error) {
        console.error('Error al obtener detalle de venta:', error);
        res.status(error.message === 'Usuario no autenticado' ? 401 : 500).json({
            success: false,
            message: error.message || 'Error al obtener los detalles de la venta'
        });
    }
};

module.exports = {
    obtenerVentas,
    obtenerDetalleVenta
};