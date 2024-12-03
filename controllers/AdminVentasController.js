const { getSucursalesbyUser} = require('../db/sucursalUsuarioSvc');
const PDFDocument = require('pdfkit');
const { format } = require('date-fns');

const obtenerVentas = async (req, res) => {
    const { supabase } = req;

    try {
        const id_usuario = req.user?.id || req.user?.id_usuario;
        if (!id_usuario) {
            throw new Error('Usuario no autenticado');
        }

        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

        const { data: ventas, error: errorVentas } = await supabase
        .from('Ventas')
        .select(`
            id_venta,
            created_at,
            sub_total,
            estado,
            id_usuario,
            descripcion,
            Usuarios (
                nombre,
                apellido
            ),
            Clientes (
                nombre_completo
            )
        `)
        .eq('id_sucursal', id_sucursal)
        .order('created_at', { ascending: false });

        if (errorVentas) throw new Error('Error al obtener las ventas');

        const { data: facturas, error: errorFacturas } = await supabase
            .from('facturas')
            .select('*')
            .in('id_venta', ventas.map(v => v.id_venta));

        if (errorFacturas) throw new Error('Error al obtener las facturas');

        const { data: sarData, error: errorSAR } = await supabase
            .from('factura_SAR')
            .select('numero_factura_SAR, numero_CAI, id_factura')
            .in('id_factura', facturas.map(f => f.id_factura));

        if (errorSAR) throw new Error('Error al obtener datos SAR');

        const facturasMap = facturas.reduce((acc, factura) => {
            acc[factura.id_venta] = factura;
            return acc;
        }, {});

        const sarMap = sarData.reduce((acc, sar) => {
            acc[sar.id_factura] = sar;
            return acc;
        }, {});

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
                id_factura: facturaData?.id_factura,
                id_usuario: venta.id_usuario,
                estado: venta.estado || 'Pagada',
                descripcion: venta.descripcion
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


const generarFactura = async (req, res) => {
    const supabase = req.supabase;
    const id_venta = req.params.id_venta;
    const id_usuario = req.params.id_usuario;
    const esCopia = req.query.esCopia === 'true';
  
    try {
        if (!id_venta || !id_usuario) {
            throw new Error('Parámetros incompletos');
        }

        // Modificamos la consulta para incluir los datos del usuario
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
            .fontSize(14)
            .text(empresa.nombre, { align: 'center' })
            .fontSize(8)
            .text('Casa Matriz', { align: 'center' })
            .text(sucursal.direccion, { align: 'center' })
            .text(`Tel: ${empresa.telefono_principal}`, { align: 'center' })
            .text(`Email: ${empresa.correo_principal}`, { align: 'center' })
            .moveDown(0.5);

        // Información de factura
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
            .font('Helvetica-Bold');

        // Agregar el texto "FACTURA--COPIA" si es una copia
        if (esCopia) {
            doc.text('FACTURA--COPIA', { align: 'center' })
                .moveDown();
        }

        doc.text('LA FACTURA ES BENEFICIO DE TODOS,', { align: 'center' })
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


const cancelarVenta = async (req, res) => {
    const { supabase } = req;
    const { id_venta } = req.params;
    const { descripcion } = req.body;

    try {
        const id_usuario = req.user?.id || req.user?.id_usuario;
        
        const { data: venta, error: ventaError } = await supabase
            .from('Ventas')
            .select(`
                id_venta,
                estado,
                id_sucursal,
                id_caja,
                facturas (
                    total,
                    tipo_factura
                ),
                ventas_detalles (
                    id_producto,
                    cantidad
                )
            `)
            .eq('id_venta', id_venta)
            .single();

        if (ventaError) throw new Error('Venta no encontrada');
        if (venta.estado === 'Cancelada') throw new Error('La venta ya está cancelada');

        const { data: caja, error: cajaError } = await supabase
            .from('caja')
            .select('valor_actual, valor_inicial')
            .eq('id_caja', venta.id_caja)
            .single();

        if (cajaError) throw new Error('Error al obtener información de la caja');

        const montoDevolver = venta.facturas[0].total;
        const nuevoValorCaja = caja.valor_actual - montoDevolver;

        // Actualizar el inventario
        const { aumentarInventario } = require('../db/inventarioSvc');
        for (const detalle of venta.ventas_detalles) {
            const { data: inventario } = await supabase
                .from('inventarios')
                .select('id_inventario, stock_actual')
                .eq('id_sucursal', venta.id_sucursal)
                .eq('id_producto', detalle.id_producto)
                .single();

            await aumentarInventario(inventario, detalle.cantidad, supabase);
        }

        // Actualizar la caja
        const { error: updateCajaError } = await supabase
            .from('caja')
            .update({ valor_actual: nuevoValorCaja })
            .eq('id_caja', venta.id_caja);

        if (updateCajaError) throw new Error('Error al actualizar la caja');

        // Actualizar estado de la venta
        const { error: updateError } = await supabase
            .from('Ventas')
            .update({ 
                estado: 'Cancelada',
                descripcion: descripcion
            })
            .eq('id_venta', id_venta);

        if (updateError) throw new Error('Error al actualizar estado de la venta');

        res.status(200).json({
            success: true,
            message: 'Venta cancelada exitosamente',
            ventaId: id_venta
        });

    } catch (error) {
        console.error('Error al cancelar venta:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const obtenerReporteCancelacion = async (req, res) => {
    const { supabase } = req;
    const { id_venta } = req.params;

    try {
        // 1. Obtener venta con información más detallada
        console.log('1. Buscando venta:', id_venta);
        
        const { data: venta, error: ventaError } = await supabase
            .from('Ventas')
            .select(`
                *,
                facturas (*)
            `)
            .eq('id_venta', id_venta)
            .single();

        console.log('2. Venta encontrada:', JSON.stringify(venta, null, 2));
        
        if (ventaError || !venta) {
            console.error('Error venta:', ventaError);
            throw new Error('Venta no encontrada');
        }

        // 2. Obtener caja
        const { data: caja, error: cajaError } = await supabase
            .from('caja')
            .select('*')
            .eq('id_caja', venta.id_caja)
            .single();

        console.log('3. Caja encontrada:', JSON.stringify(caja, null, 2));

        if (cajaError || !caja) {
            console.error('Error caja:', cajaError);
            throw new Error('Información de caja no encontrada');
        }

        // 3. Preparar datos para el reporte con estructura completa
        const datosReporte = {
            venta: {
                id_venta: venta.id_venta,
                estado: venta.estado,
                fecha_creacion: venta.created_at,
                facturas: venta.facturas,
                descripcion: venta.descripcion
            },
            caja: {
                valor_actual: caja.valor_actual,
                valor_inicial: caja.valor_inicial
            },
            montoDevolver: venta.facturas[0]?.total || 0,
            nuevoValorCaja: caja.valor_actual - (venta.facturas[0]?.total || 0),
            descripcion: venta.descripcion
        };

        console.log('4. Datos preparados para reporte:', JSON.stringify(datosReporte, null, 2));

        // 4. Generar el reporte
        await generarReporteCancelacion(req, res, datosReporte);

    } catch (error) {
        console.error('Error completo:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const generarReporteCancelacion = async (req, res) => {
    const { supabase } = req;
    const { id_venta } = req.params;
    
    console.log('Iniciando generación de reporte para venta:', id_venta);

    try {
        const { data: venta, error: ventaError } = await supabase
            .from('Ventas')
            .select(`
                *,
                facturas:facturas (*)
            `)
            .eq('id_venta', id_venta)
            .single();

        console.log('Datos de venta obtenidos:', venta);
        
        if (ventaError || !venta) {
            console.error('Error al obtener venta:', ventaError);
            throw new Error('Venta no encontrada');
        }

        const { data: caja, error: cajaError } = await supabase
            .from('caja')
            .select('*')
            .eq('id_caja', venta.id_caja)
            .single();

        console.log('Datos de caja obtenidos:', caja);

        if (cajaError || !caja) {
            console.error('Error al obtener caja:', cajaError);
            throw new Error('Caja no encontrada');
        }

        // Crear el documento PDF
        const doc = new PDFDocument();
        
        // Configurar las cabeceras de respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=cancelacion_venta_${id_venta}.pdf`);
        
        // Pipe el PDF a la respuesta
        doc.pipe(res);

        // Contenido del PDF
        doc.fontSize(16)
           .text('Reporte de Cancelación de Venta', { align: 'center' })
           .moveDown();

        doc.fontSize(12)
           .text(`Fecha de Cancelación: ${new Date().toLocaleString('es-HN')}`)
           .text(`No. de Venta: ${venta.id_venta}`)
           .text(`Fecha de Venta Original: ${new Date(venta.created_at).toLocaleString('es-HN')}`)
           .moveDown();

        if (venta.facturas && venta.facturas[0]) {
            doc.text('Detalles de la Transacción:')
               .text(`Monto a Cancelar: L. ${venta.facturas[0].total.toFixed(2)}`)
               .text(`Tipo de Pago Original: ${venta.facturas[0].tipo_factura}`)
               .text(`Valor en Caja Actual: L. ${caja.valor_actual.toFixed(2)}`)
               .moveDown();
        }

        doc.fontSize(12)
           .text('Motivo de la Cancelación:', { underline: true })
           .text(venta.descripcion || 'No se proporcionó motivo')
           .moveDown();

        // Firmas
        doc.moveDown(2)
           .text('_______________________', { align: 'center' })
           .text('Firma del Supervisor', { align: 'center' })
           .moveDown()
           .text('_______________________', { align: 'center' })
           .text('Firma del Cajero', { align: 'center' });

        // Finalizar el PDF
        doc.end();

    } catch (error) {
        console.error('Error al generar reporte:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};


module.exports = {
    obtenerVentas,
    obtenerDetalleVenta,
    generarFactura,
    cancelarVenta,
    obtenerReporteCancelacion,
    generarReporteCancelacion
};