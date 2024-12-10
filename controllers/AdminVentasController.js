const { getSucursalesbyUser} = require('../db/sucursalUsuarioSvc');
const PDFDocument = require('pdfkit');
const { format } = require('date-fns');

const obtenerVentasCeo = async (req, res) => {
    const { supabase } = req;
    const { id_sucursal } = req.params;

    try {

        const { data: ventas, error: errorVentas } = await supabase
        .from('Ventas')
        .select(`
            id_venta,
            created_at,
            sub_total,
            estado,
            id_usuario,
            id_sucursal,
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
                id_sucursal: venta.id_sucursal,
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

    const formatNumeroFactura = (numero) => {
        return `${numero.slice(0,3)}-${numero.slice(3,6)}-${numero.slice(6,8)}-${numero.slice(8)}`;
    };

    const formatRangoFacturacion = (numero) => {
        return `${numero.slice(0,3)}-${numero.slice(3,6)}-${numero.slice(6,8)}-${numero.slice(8)}`;
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

    const adjustToHondurasTime = (date) => {
        const hondurasDate = new Date(date);
        const hondurasOffset = -6 * 60; // -6 horas en minutos
        const currentOffset = hondurasDate.getTimezoneOffset();
        const offsetDiff = hondurasOffset - currentOffset;
        hondurasDate.setMinutes(hondurasDate.getMinutes() + offsetDiff);
        return hondurasDate;
    };
  
    try {
        if (!id_venta || !id_usuario) {
            throw new Error('Parámetros incompletos');
        }

        console.log('Iniciando búsqueda de venta con ID:', id_venta);

        const { data: ventaBasica, error: ventaBasicaError } = await supabase
            .from('Ventas')
            .select('*')
            .eq('id_venta', id_venta)
            .single();

        if (ventaBasicaError) {
            console.error('Error al verificar venta básica:', ventaBasicaError);
            throw new Error(`No se encontró la venta con ID: ${id_venta}`);
        }

        console.log('Venta básica encontrada:', ventaBasica);

        const { data: factura, error: facturaError } = await supabase
            .from('facturas')
            .select('*, factura_SAR (*)')
            .eq('id_venta', id_venta)
            .single();

        if (facturaError) {
            console.error('Error al obtener factura:', facturaError);
            throw new Error('Error al obtener datos de factura');
        }

        console.log('Factura encontrada:', factura);

        let cliente = null;
        if (ventaBasica.id_cliente) {
            const { data: clienteData, error: clienteError } = await supabase
                .from('Clientes')
                .select('*')
                .eq('id_cliente', ventaBasica.id_cliente)
                .single();

            if (!clienteError) {
                cliente = clienteData;
                console.log('Cliente encontrado:', cliente);
            } else {
                console.log('Cliente no encontrado, se usará Consumidor Final');
            }
        }

        const { data: usuario, error: usuarioError } = await supabase
            .from('Usuarios')
            .select('nombre, apellido')
            .eq('id_usuario', ventaBasica.id_usuario)
            .single();

        if (usuarioError) {
            console.error('Error al obtener usuario:', usuarioError);
            throw new Error('Error al obtener datos del usuario');
        }

        console.log('Usuario encontrado:', usuario);

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

        console.log('Sucursal y empresa encontradas:', sucursal);

        const empresa = sucursal.Empresas;

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

        console.log('Detalles de venta encontrados:', detalles);

        let datosSAR = null;
        if (empresa.usa_SAR) {
            const { data: sarData, error: sarError } = await supabase
                .from('Datos_SAR')
                .select('rango_inicial, rango_final, fecha_vencimiento')
                .eq('id_sucursal', ventaBasica.id_sucursal)
                .single();

            if (!sarError) {
                datosSAR = sarData;
                console.log('Datos SAR encontrados:', datosSAR);
            } else {
                console.log('No hay registro válido de la sucursal en SAR');
            }
        }

        console.log('Iniciando creación del PDF...');
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

        if (esCopia) {
            doc.font('Helvetica-Bold')
                .fontSize(12)
                .text('COPIA', { align: 'center' })
                .moveDown(0.5);
        }

        doc.font('Helvetica-Bold')
            .fontSize(12)
            .text(empresa.nombre, { align: 'center' })
            .fontSize(8)
            .text(empresa.direccion, { align: 'center' })
            .text(`Tel: ${empresa.telefono_principal}`, { align: 'center' })
            .text(`Email: ${empresa.correo_principal}`, { align: 'center' })
            .moveDown(0.5);

        const fechaHonduras = adjustToHondurasTime(ventaBasica.created_at);

        doc.font('Helvetica')
            .fontSize(8)
            .text(`Sucursal: ${sucursal.nombre_administrativo}`)
            .text(`Factura: ${empresa.usa_SAR && factura.factura_SAR.length > 0 ? 
                formatNumeroFactura(factura.factura_SAR[0].numero_factura_SAR) : 
                factura.codigo_factura}`)
            .text(`Fecha Emisión: ${format(fechaHonduras, 'dd-MM-yyyy hh:mm:ss')}`)
            .text(`Cajer@: ${usuario.nombre} ${usuario.apellido}`)
            .text(`Cliente: ${cliente?.nombre_completo || 'Consumidor Final'}`)
            .text(`R.T.N: ${cliente?.rtn || '00000000000000'}`)
            .moveDown(0.5);

        const startY = doc.y;
        doc.font('Helvetica-Bold')
            .text('Cant.', 10, startY, { width: 25 })
            .text('Nombre', 35, startY, { width: 130 })
            .text('Precio', 165, startY, { width: 40, align: 'right' })
            .text('T', 205, startY, { width: 12, align: 'center' });

        doc.moveTo(10, doc.y + 0).lineTo(217, doc.y + 0).stroke();
        doc.moveDown(0.3);

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

        doc.moveTo(10, doc.y + 5).lineTo(217, doc.y + 5).stroke();
        doc.moveDown();

        printLineItem('IMPORTE EXONERADO:', factura.total_extento);
        printLineItem('IMPORTE GRAVADO 15%:', factura.gravado_15);
        printLineItem('IMPORTE GRAVADO 18%:', factura.gravado_18);
        printLineItem('Rebajas y Descuento:', factura.descuento);
        printLineItem('ISV 15%:', factura.ISV_15);
        printLineItem('ISV 18%:', factura.ISV_18);

        doc.font('Helvetica-Bold')
            .text('Total:', 10)
            .text(factura.total.toFixed(2), 170, doc.y - 12, { align: 'right' })
            .font('Helvetica')
            .moveDown();

        printLineItem('Tipo de Pago:', factura.tipo_factura);
        printLineItem('Efectivo:', factura.pago);
        printLineItem('Cambio:', factura.cambio);

        doc.text(' ', 10)
            .moveDown(0.5)
            .text(numeroALetras(factura.total), { align: 'center' })
            .moveDown()
            .moveDown()
            .text('No. de Orden de Compra Exenta:', { align: 'center' })
            .text('No. Constancia de Registro de Exonerados:', { align: 'center' })
            .text('No. Registro de SAG:', { align: 'center' })
            .moveDown();

        if (empresa.usa_SAR && datosSAR && factura.factura_SAR.length > 0) {
            doc.text(`CAI: ${factura.factura_SAR[0].numero_CAI}`, { align: 'center' })
                .text(`Rango Facturación: ${formatRangoFacturacion(datosSAR.rango_inicial)} A ${formatRangoFacturacion(datosSAR.rango_final)}`, { align: 'center' })
                .text(`Fecha Límite de Emisión: ${format(new Date(datosSAR.fecha_vencimiento), 'dd-MM-yyyy')}`, { align: 'center' })
                .moveDown();
        }

        doc.font('Helvetica-Bold');
        if (esCopia) {
            doc.text('FACTURA--COPIA', { align: 'center' })
                .moveDown();
        }

        doc.text('LA FACTURA ES BENEFICIO DE TODOS,', { align: 'center' })
            .text('EXIJALA', { align: 'center' });

        console.log('Finalizando documento PDF...');
        doc.end();
        console.log('PDF generado exitosamente');

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
            .select('valor_actual, valor_inicial, dinerocaja')
            .eq('id_caja', venta.id_caja)
            .single();

        if (cajaError) throw new Error('Error al obtener información de la caja');

        const montoDevolver = venta.facturas[0].total;
        const nuevoValorCaja = caja.valor_actual - montoDevolver;
        const nuevoDineroCaja = caja.dinerocaja - montoDevolver;

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

        // Actualizar la caja con ambos valores
        const { error: updateCajaError } = await supabase
            .from('caja')
            .update({ 
                valor_actual: nuevoValorCaja,
                dinerocaja: nuevoDineroCaja
            })
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

    try {
        console.log('Buscando venta con ID:', id_venta);

        const { data: venta, error: ventaError } = await supabase
            .from('Ventas')
            .select(`
                *,
                facturas!inner (
                    *,
                    factura_SAR (
                        numero_factura_SAR
                    )
                ),
                ventas_detalles (*)
            `)
            .eq('id_venta', id_venta)
            .single();
        
        console.log('Resultado de la consulta:', { venta, error: ventaError });

        if (ventaError) {
            console.error('Error al obtener la venta:', ventaError);
            throw new Error(`Error al obtener la venta: ${ventaError.message}`);
        }

        if (!venta) {
            throw new Error(`No se encontró la venta con ID: ${id_venta}`);
        }

        console.log('Buscando caja con ID:', venta.id_caja);

        const { data: caja, error: cajaError } = await supabase
            .from('caja')
            .select('*')
            .eq('id_caja', venta.id_caja)
            .single();

        console.log('Resultado de consulta de caja:', { caja, error: cajaError });

        if (cajaError) {
            console.error('Error al obtener la caja:', cajaError);
            throw new Error(`Error al obtener la caja: ${cajaError.message}`);
        }

        if (!caja) {
            throw new Error(`No se encontró la caja con ID: ${venta.id_caja}`);
        }

        const doc = new PDFDocument({
            size: [227, 800],
            margin: 15
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=anulacion_venta_${id_venta}.pdf`);
        
        doc.pipe(res);
        
        const anchoDisponible = 197;
        const anchoMitad = anchoDisponible / 2;
        
        const formatCurrency = (amount) => {
            return `L. ${Number(amount).toFixed(2)}`;
        };
        
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

        // Título
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .text('REPORTE DE ANULACIÓN', {
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
           .text(`Fecha Anulación: ${new Date().toLocaleString('es-HN')}`, {
               width: anchoDisponible,
               align: 'left'
           })
           .text(`Factura: ${venta.facturas[0]?.factura_SAR?.[0]?.numero_factura_SAR || 'N/A'}`, {
               width: anchoDisponible,
               align: 'left'
           })
           .moveDown(0.5);

        const factura = venta.facturas[0];
        const montoAnulado = factura.total;
        
        // Resumen de totales
        doc.font('Helvetica-Bold')
           .text('RESUMEN DE ANULACIÓN:', {
               width: anchoDisponible,
               align: 'center'
           })
           .moveDown(0.5);

        // Mostrar los totales
        [
            ['Total Efectivo:', formatCurrency(factura.tipo_factura === 'Efectivo' ? montoAnulado : 0)],
            ['Total Transferencia:', formatCurrency(factura.tipo_factura === 'Transferencia' ? montoAnulado : 0)],
            ['Total ISV 15%:', formatCurrency(factura.isv15 || 0)],
            ['Total ISV 18%:', formatCurrency(factura.isv18 || 0)],
            ['Total Gravado 15%:', formatCurrency(factura.gravado15 || 0)],
            ['Total Gravado 18%:', formatCurrency(factura.gravado18 || 0)],
            ['Total Exento:', formatCurrency(factura.exento || 0)]
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

        const totalSistema = caja.valor_actual;
        const totalCaja = caja.dinerocaja;
        const diferencia = totalCaja - totalSistema;
        const hayFaltante = diferencia < 0;
        const haySobrante = diferencia > 0;

        [
            ['Total Sistema:', formatCurrency(totalSistema)],
            ['Total en Caja:', formatCurrency(totalCaja)],
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

        // Observación
        doc.font('Helvetica-Bold')
           .text('OBSERVACIÓN:', {
               width: anchoDisponible,
               align: 'center'
           })
           .moveDown(0.5)
           .font('Helvetica')
           .fontSize(8)
           .text(venta.descripcion || 'Sin observación', {
               width: anchoDisponible,
               align: 'left'
           })
           .moveDown(0.5);
        
        // Línea separadora
        doc.moveTo(15, doc.y)
           .lineTo(212, doc.y)
           .stroke()
           .moveDown(0.5);
        
        // Firmas una al lado de la otra
        doc.moveDown(2);
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
        doc.y = yPosicion;
        doc.x = anchoMitad + 15;
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
        doc.x = 15;
        doc.moveDown(2)
           .fontSize(6)
           .text(`Impreso: ${new Date().toLocaleString('es-HN')}`, {
               align: 'center',
               width: anchoDisponible
           });

        doc.end();

    } catch (error) {
        console.error('Error completo en generarReporteCancelacion:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: error.message,
                details: {
                    id_venta,
                    errorCompleto: error.toString()
                }
            });
        }
    }
};

module.exports = {
    obtenerVentasCeo,
    obtenerVentas,
    obtenerDetalleVenta,
    generarFactura,
    cancelarVenta,
    obtenerReporteCancelacion,
    generarReporteCancelacion
};