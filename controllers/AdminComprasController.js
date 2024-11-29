const { getSucursalesbyUser } = require('../db/sucursalUsuarioSvc');
const PDFDocument = require('pdfkit');
const { format } = require('date-fns');

const obtenerCompras = async (req, res) => {
    const { supabase } = req;

    try {
        const id_usuario = req.user?.id || req.user?.id_usuario;
        if (!id_usuario) {
            throw new Error('Usuario no autenticado');
        }

        // Obtener la sucursal del usuario
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);
        console.log('1. Sucursal obtenida:', id_sucursal);

        // Obtener todas las compras
        const { data: compras, error: errorCompras } = await supabase
            .from('Compras')
            .select(`
                id_compra,
                created_at,
                referencia_pago,
                total,
                estado_pago,
                metodo_pago,
                id_usuario,
                Usuarios (
                    nombre,
                    apellido
                ),
                proveedores (
                    nombre,
                    correo
                )
            `)
            .eq('id_sucursal', id_sucursal)
            .order('created_at', { ascending: false });

        if (errorCompras) throw new Error('Error al obtener las compras');

        // Obtener todos los detalles de compras de una vez
        const { data: detalles, error: errorDetalles } = await supabase
            .from('Compras_detalles')
            .select('id_compra, cantidad')
            .in('id_compra', compras.map(c => c.id_compra));

        if (errorDetalles) throw new Error('Error al obtener los detalles');

        // Crear mapa de cantidades totales por compra
        const cantidadesMap = detalles.reduce((acc, detalle) => {
            acc[detalle.id_compra] = (acc[detalle.id_compra] || 0) + detalle.cantidad;
            return acc;
        }, {});

        // Formatear compras
        const comprasFormateadas = compras.map(compra => ({
            codigo: compra.referencia_pago,
            nombre: compra.Usuarios ? `${compra.Usuarios.nombre} ${compra.Usuarios.apellido}` : 'N/A',
            proveedor: compra.proveedores ? compra.proveedores.nombre : 'N/A',
            cantidad: cantidadesMap[compra.id_compra] || 0,
            total: compra.total || 0,
            fechaHora: compra.created_at,
            estado: compra.estado_pago,
            metodo_pago: compra.metodo_pago,
            id_compra: compra.id_compra
        }));

        res.status(200).json({
            success: true,
            data: comprasFormateadas,
            message: 'Compras obtenidas exitosamente'
        });

    } catch (error) {
        console.error('Error al obtener compras:', error);
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
        const id_usuario = req.user?.id || req.user?.id_usuario;
        if (!id_usuario) {
            throw new Error('Usuario no autenticado');
        }

        // Realizar todas las consultas en paralelo
        const [compraResult, detallesResult] = await Promise.all([
            // Consulta de compra
            supabase
                .from('Compras')
                .select(`
                    id_compra,
                    created_at,
                    referencia_pago,
                    total,
                    estado_pago,
                    metodo_pago,
                    Usuarios (
                        nombre,
                        apellido
                    ),
                    proveedores (
                        nombre,
                        correo,
                        telefono
                    )
                `)
                .eq('id_compra', id_compra)
                .single(),

            // Consulta de detalles y productos
            supabase
                .from('Compras_detalles')
                .select(`
                    cantidad,
                    precio_compra,
                    total_detalle,
                    producto (
                        nombre,
                        codigo_producto,
                        descripcion
                    )
                `)
                .eq('id_compra', id_compra)
        ]);

        if (compraResult.error) throw new Error('Compra no encontrada');
        if (detallesResult.error) throw new Error('Error al obtener detalles de la compra');

        const compra = compraResult.data;
        const detallesProductos = detallesResult.data;

        // Formatear respuesta
        const detalleCompra = {
            codigo: compra.referencia_pago,
            nombre: `${compra.Usuarios.nombre} ${compra.Usuarios.apellido}`,
            proveedor: compra.proveedores?.nombre || 'N/A',
            telefono_proveedor: compra.proveedores?.telefono || 'N/A',
            correo_proveedor: compra.proveedores?.correo || 'N/A',
            total: compra.total || 0,
            fechaHora: compra.created_at,
            estado: compra.estado_pago,
            metodo_pago: compra.metodo_pago,
            productos: detallesProductos.map(detalle => ({
                nombre: detalle.producto.nombre,
                codigo: detalle.producto.codigo_producto,
                descripcion: detalle.producto.descripcion,
                cantidad: detalle.cantidad,
                precio_unitario: detalle.precio_compra,
                total: detalle.total_detalle
            }))
        };

        res.status(200).json({
            success: true,
            data: detalleCompra,
            message: 'Detalles de compra obtenidos exitosamente'
        });

    } catch (error) {
        console.error('Error al obtener detalle de compra:', error);
        res.status(error.message === 'Usuario no autenticado' ? 401 : 500).json({
            success: false,
            message: error.message || 'Error al obtener los detalles de la compra'
        });
    }
};

const registrarCompra = async (req, res) => {
    const { supabase } = req;
    
    try {
        const id_usuario = req.user?.id || req.user?.id_usuario;
        if (!id_usuario) {
            throw new Error('Usuario no autenticado');
        }

        const {
            referencia_pago,
            id_proveedor,
            metodo_pago,
            total,
            productos
        } = req.body;

        // Obtener la sucursal del usuario
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

        // Iniciar transacción
        const { data: compra, error: compraError } = await supabase
            .from('Compras')
            .insert({
                referencia_pago,
                id_usuario,
                id_proveedor,
                id_sucursal,
                estado_pago: 'Completado',
                metodo_pago,
                total
            })
            .select()
            .single();

        if (compraError) throw new Error('Error al registrar la compra');

        // Registrar detalles y actualizar inventario
        for (const producto of productos) {
            // Insertar detalle
            const { error: detalleError } = await supabase
                .from('Compras_detalles')
                .insert({
                    id_compra: compra.id_compra,
                    id_producto: producto.id_producto,
                    cantidad: producto.cantidad,
                    precio_compra: producto.precio_unitario,
                    total_detalle: producto.total
                });

            if (detalleError) throw new Error('Error al registrar detalle de compra');

            // Actualizar inventario
            const { data: inventario, error: invError } = await supabase
                .from('inventarios')
                .select('stock_actual')
                .eq('id_producto', producto.id_producto)
                .eq('id_sucursal', id_sucursal)
                .single();

            if (invError) throw new Error('Error al obtener inventario');

            const { error: updateError } = await supabase
                .from('inventarios')
                .update({ 
                    stock_actual: inventario.stock_actual + producto.cantidad 
                })
                .eq('id_producto', producto.id_producto)
                .eq('id_sucursal', id_sucursal);

            if (updateError) throw new Error('Error al actualizar inventario');
        }

        res.status(200).json({
            success: true,
            data: compra,
            message: 'Compra registrada exitosamente'
        });

    } catch (error) {
        console.error('Error al registrar compra:', error);
        res.status(error.message === 'Usuario no autenticado' ? 401 : 500).json({
            success: false,
            message: error.message || 'Error al registrar la compra'
        });
    }
};

const generarReporteCompras = async (req, res) => {
    const { supabase } = req;
    const { fechaInicio, fechaFin } = req.query;

    try {
        const id_usuario = req.user?.id || req.user?.id_usuario;
        if (!id_usuario) {
            throw new Error('Usuario no autenticado');
        }

        // Obtener la sucursal del usuario
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

        // Consultar compras en el rango de fechas
        const { data: compras, error: errorCompras } = await supabase
            .from('Compras')
            .select(`
                id_compra,
                created_at,
                referencia_pago,
                total,
                estado_pago,
                metodo_pago,
                Usuarios (
                    nombre,
                    apellido
                ),
                proveedores (
                    nombre,
                    correo
                )
            `)
            .eq('id_sucursal', id_sucursal)
            .gte('created_at', fechaInicio)
            .lte('created_at', fechaFin)
            .order('created_at', { ascending: true });

        if (errorCompras) throw new Error('Error al obtener las compras para el reporte');

        // Crear el PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=reporte-compras-${fechaInicio}-${fechaFin}.pdf`);
        doc.pipe(res);

        // Diseño del reporte
        doc.fontSize(20).text('Reporte de Compras', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Período: ${fechaInicio} al ${fechaFin}`, { align: 'center' });
        doc.moveDown();

        // Tabla de compras
        let totalGeneral = 0;
        compras.forEach((compra, index) => {
            doc.text(`${index + 1}. Referencia: ${compra.referencia_pago}`);
            doc.text(`   Proveedor: ${compra.proveedores.nombre}`);
            doc.text(`   Empleado: ${compra.Usuarios.nombre} ${compra.Usuarios.apellido}`);
            doc.text(`   Fecha: ${format(new Date(compra.created_at), 'dd/MM/yyyy HH:mm')}`);
            doc.text(`   Estado: ${compra.estado_pago}`);
            doc.text(`   Total: L. ${compra.total.toFixed(2)}`);
            doc.moveDown();
            totalGeneral += compra.total;
        });

        // Resumen
        doc.moveDown();
        doc.fontSize(14).text('Resumen', { underline: true });
        doc.fontSize(12).text(`Total de compras: ${compras.length}`);
        doc.text(`Monto total: L. ${totalGeneral.toFixed(2)}`);

        doc.end();

    } catch (error) {
        console.error('Error al generar reporte de compras:', error);
        res.status(error.message === 'Usuario no autenticado' ? 401 : 500).json({
            success: false,
            message: error.message || 'Error al generar el reporte de compras'
        });
    }
};

const actualizarEstadoCompra = async (req, res) => {
    const { id_compra } = req.params;
    const { estado } = req.body;
    const { supabase } = req;

    try {
        const id_usuario = req.user?.id || req.user?.id_usuario;
        if (!id_usuario) {
            throw new Error('Usuario no autenticado');
        }

        // Validar estado
        const estadosValidos = ['Pendiente', 'Completado', 'Cancelado'];
        if (!estadosValidos.includes(estado)) {
            throw new Error('Estado no válido');
        }

        // Actualizar estado de la compra
        const { error: errorActualizacion } = await supabase
            .from('Compras')
            .update({ estado_pago: estado })
            .eq('id_compra', id_compra);

        if (errorActualizacion) throw new Error('Error al actualizar el estado de la compra');

        res.status(200).json({
            success: true,
            message: 'Estado de compra actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar estado de compra:', error);
        res.status(error.message === 'Usuario no autenticado' ? 401 : 500).json({
            success: false,
            message: error.message || 'Error al actualizar el estado de la compra'
        });
    }
};

module.exports = {
    obtenerCompras,
    obtenerDetalleCompra,
    registrarCompra,
    generarReporteCompras,
    actualizarEstadoCompra
};

