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

        // Primero obtener las ventas con sus relaciones más importantes
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

        if (errorVentas) {
            console.error('Error al obtener ventas:', errorVentas);
            throw new Error('Error al obtener las ventas');
        }

        console.log('2. Ventas encontradas:', ventas?.length || 0);

        // Procesar cada venta para obtener sus facturas y datos SAR
        const ventasPromises = ventas.map(async (venta) => {
            // Obtener la factura relacionada
            const { data: facturaData, error: facturaError } = await supabase
                .from('facturas')
                .select('*')
                .eq('id_venta', venta.id_venta)
                .single();

            if (facturaError) {
                console.log(`No se encontró factura para la venta ${venta.id_venta}`);
                return null;
            }

            // Obtener datos SAR si existe factura
            let sarData = null;
            if (facturaData) {
                const { data: sar } = await supabase
                    .from('factura_SAR')
                    .select('numero_factura_SAR, numero_CAI')
                    .eq('id_factura', facturaData.id_factura)
                    .single();
                sarData = sar;
            }

            return {
                codigo: venta.id_venta,
                nombre: venta.Usuarios ? `${venta.Usuarios.nombre} ${venta.Usuarios.apellido}` : 'N/A',
                cliente: venta.Clientes ? venta.Clientes.nombre_completo : 'Consumidor Final', // Cambiado aquí
                subtotal: venta.sub_total || 0,
                descuento: facturaData?.descuento || 0,
                total: facturaData?.total || 0,
                total_impuesto: facturaData ? (facturaData.ISV_15 || 0) + (facturaData.ISV_18 || 0) : 0,
                fechaHora: venta.created_at,
                numero_factura: sarData?.numero_factura_SAR || 'N/A',
                cai: sarData?.numero_CAI || 'N/A',
                id_factura: facturaData?.id_factura
            };
        });

        const ventasFormateadas = (await Promise.all(ventasPromises))
            .filter(venta => venta !== null);

        console.log('3. Ventas formateadas final:', ventasFormateadas.length);

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

        // Obtener la venta con sus relaciones básicas
        const { data: venta, error: ventaError } = await supabase
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
            .single();

        if (ventaError || !venta) {
            throw new Error('Venta no encontrada');
        }

        // Obtener la factura
        const { data: factura, error: facturaError } = await supabase
            .from('facturas')
            .select('*')
            .eq('id_venta', id_venta)
            .single();

        if (facturaError) {
            console.error('Error al obtener factura:', facturaError);
            throw new Error('Error al obtener detalles de la factura');
        }

        // Obtener datos SAR
        let sarData = null;
        if (factura) {
            const { data: sar } = await supabase
                .from('factura_SAR')
                .select('numero_factura_SAR, numero_CAI')
                .eq('id_factura', factura.id_factura)
                .single();
            sarData = sar;
        }

        // Obtener los detalles de los productos vendidos usando la tabla Compras_detalles
        const { data: detallesProductos, error: detallesError } = await supabase
            .from('Compras_detalles')
            .select(`
                cantidad,
                precio_compra,
                total_detalle,
                producto:id_producto (
                    nombre,
                    codigo_producto,
                    descripcion
                )
            `)
            .eq('id_compra', id_venta); // Cambiado id_factura por id_compra ya que es una venta

        if (detallesError) {
            console.error('Error al obtener detalles de productos:', detallesError);
            throw new Error('Error al obtener detalles de los productos');
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
                nombre: detalle.producto.nombre,
                codigo: detalle.producto.codigo_producto,
                descripcion: detalle.producto.descripcion,
                cantidad: detalle.cantidad,
                precio_unitario: detalle.precio_compra,
                subtotal: detalle.total_detalle,
                // Si no hay descuento en la tabla de Compras_detalles, lo ponemos en 0
                descuento: 0,
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