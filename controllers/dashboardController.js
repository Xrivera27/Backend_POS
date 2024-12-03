const { getEmpresaId } = require('../db/empresaSvc.js');

const getVentasEmpresa = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.params.id_usuario;
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        const { data, error } = await supabase.from('Sucursales')
            .select('id_sucursal')
            .eq('id_empresa', id_empresa)
            .eq('estado', true);

        if (error) {
            return res.status(500).json({ error: 'Error al obtener sucursales: ' + error.message });
        }
        if (data.length === 0) {
            return res.status(500).json({ error: 'No hay sucursales disponibles: ' });
        }

        const { data: ventasSucursales, error: errorVentasSucursales } = await supabase.from('Ventas')
            .select('id_venta, facturas(id_factura, total)')
            .gte('created_at', inicioHoy.toISOString())
            .lte('created_at', finHoy.toISOString())
            .in('id_sucursal', data.map(d => d.id_sucursal));  

        if (errorVentasSucursales) {
            console.log(errorVentasSucursales);
            return res.status(500).json({ error: 'Error de ventas por sucursales ' + error.message });
        }

        let total = 0;
        ventasSucursales.forEach(venta => {
            venta.facturas.forEach(factura => {
                total += factura.total; // Agrega el total de cada factura a la variable global
            });
        });

        // Redondear a 2 dígitos después del punto decimal
        total = parseFloat(total.toFixed(2));

        res.status(200).json(total);
    } catch (error) {
        console.error('Error en el endpoint de ventas:', error);
        res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
};

const getClientesEmpresa = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.params.id_usuario;

    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);

        if (!id_empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada para el usuario especificado.' });
        }

        const { data: clientes, count, error } = await supabase
            .from('Clientes')
            .select('*', { count: 'exact' }) 
            .eq('id_empresa', id_empresa)
            .eq('estado', true);

        if (error) {
            return res.status(500).json({ error: 'Error al contar clientes: ' + error.message });
        }

        res.status(200).json({ totalClientes: count });
    } catch (error) {
        console.error('Error en el endpoint de clientes:', error);
        res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
};

const getAlertasPromocion = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.params.id_usuario;

    if (!id_usuario) {
        return res.status(400).json({ error: 'ID de usuario no proporcionado.' });
    }

    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);

        if (!id_empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada para el usuario especificado.' });
        }

        const { data: alertas, count, error } = await supabase
            .from('alerts')
            .select('*', { count: 'exact' })
            .eq('id_empresa', id_empresa)
            .in('tipo', ['promocion_categoria_entrante', 'promocion_producto_entrante']);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Error al obtener alertas de promoción: ' + error.message });
        }

        res.status(200).json({ totalAlertas: count, alertas });
    } catch (error) {
        console.error('Error en el endpoint de alertas de promoción:', error);
        res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
};

const getAlertasPorPromocionProducto = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.params.id_usuario;

    if (!id_usuario) {
        return res.status(400).json({ error: 'ID de usuario no proporcionado.' });
    }

    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);

        if (!id_empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada para el usuario especificado.' });
        }

        const { data: alertasProducto, count, error } = await supabase
            .from('alerts')
            .select('*', { count: 'exact' })
            .eq('id_empresa', id_empresa)
            .eq('tipo', 'promocion_producto_entrante');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Error al obtener alertas de promoción de producto: ' + error.message });
        }

        res.status(200).json({ totalAlertasProducto: count, alertasProducto });
    } catch (error) {
        console.error('Error en el endpoint de alertas de promoción de producto:', error);
        res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
};

const getVentasUltimosTresMeses = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.params.id_usuario;

    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        
        if (!id_empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada para el usuario especificado.' });
        }

        const { data: sucursales, error: errorSucursales } = await supabase
            .from('Sucursales')
            .select('id_sucursal')
            .eq('id_empresa', id_empresa)
            .eq('estado', true);

        if (errorSucursales) {
            return res.status(500).json({ error: 'Error al obtener sucursales: ' + errorSucursales.message });
        }

        const fechaActual = new Date();
        const tresMesesAtras = new Date();
        tresMesesAtras.setMonth(fechaActual.getMonth() - 2);
        tresMesesAtras.setDate(1);
        tresMesesAtras.setHours(0, 0, 0, 0);

        // Obtener ventas pagadas
        const { data: ventasPagadas, error: errorVentasPagadas } = await supabase
            .from('Ventas')
            .select('created_at')
            .in('id_sucursal', sucursales.map(s => s.id_sucursal))
            .eq('estado', 'Pagada')
            .gte('created_at', tresMesesAtras.toISOString())
            .lte('created_at', fechaActual.toISOString());

        // Obtener ventas canceladas
        const { data: ventasCanceladas, error: errorVentasCanceladas } = await supabase
            .from('Ventas')
            .select('created_at')
            .in('id_sucursal', sucursales.map(s => s.id_sucursal))
            .eq('estado', 'Cancelada')
            .gte('created_at', tresMesesAtras.toISOString())
            .lte('created_at', fechaActual.toISOString());

        if (errorVentasPagadas || errorVentasCanceladas) {
            return res.status(500).json({ error: 'Error al obtener ventas' });
        }

        const nombresMeses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        // Inicializar contadores para ambos tipos de ventas
        const ventasPorMes = {};
        for (let i = 2; i >= 0; i--) {
            const fecha = new Date();
            fecha.setMonth(fechaActual.getMonth() - i);
            const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
            ventasPorMes[mesKey] = {
                nombre: nombresMeses[fecha.getMonth()],
                cantidadPagadas: 0,
                cantidadCanceladas: 0
            };
        }

        // Contar ventas pagadas por mes
        ventasPagadas?.forEach(venta => {
            const fecha = new Date(venta.created_at);
            const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
            if (ventasPorMes[mesKey]) {
                ventasPorMes[mesKey].cantidadPagadas++;
            }
        });

        // Contar ventas canceladas por mes
        ventasCanceladas?.forEach(venta => {
            const fecha = new Date(venta.created_at);
            const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
            if (ventasPorMes[mesKey]) {
                ventasPorMes[mesKey].cantidadCanceladas++;
            }
        });

        const chartData = {
            lineChartData: {
                labels: Object.values(ventasPorMes).map(mes => mes.nombre),
                datasets: [
                    {
                        label: 'Ventas Pagadas',
                        borderColor: '#36A2EB',
                        data: Object.values(ventasPorMes).map(mes => mes.cantidadPagadas),
                        fill: false,
                    },
                    {
                        label: 'Ventas Canceladas',
                        borderColor: '#FF6384',
                        data: Object.values(ventasPorMes).map(mes => mes.cantidadCanceladas),
                        fill: false,
                    }
                ]
            },
            lineChartOptions: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                return `${label}: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return Math.floor(value);
                            }
                        }
                    }
                }
            }
        };

        res.status(200).json({
            chartData,
            resumenVentas: Object.values(ventasPorMes)
        });

    } catch (error) {
        console.error('Error en el endpoint de ventas por mes:', error);
        res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
};

const getCategoriasPopulares = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.params.id_usuario;

    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        
        if (!id_empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada para el usuario especificado.' });
        }

        // Obtener categorías de la empresa
        const { data: categorias, error: errorCategorias } = await supabase
            .from('categoria_producto')
            .select('id_categoria, nombre_categoria')
            .eq('id_empresa', id_empresa)
            .eq('estado', true);

        if (errorCategorias) {
            return res.status(500).json({ error: 'Error al obtener categorías: ' + errorCategorias.message });
        }

        // Obtener ventas_detalles con el nombre correcto de la tabla
        const { data: ventasDetalles, error: errorVentas } = await supabase
            .from('ventas_detalles')
            .select(`
                cantidad,
                id_producto,
                id_detalle_venta,
                id_venta
            `);

        if (errorVentas) {
            return res.status(500).json({ error: 'Error al obtener detalles de ventas: ' + errorVentas.message });
        }

        // Obtener la asignación de productos a categorías
        const { data: asignaciones, error: errorAsignaciones } = await supabase
            .from('asignacion_producto_categoria')
            .select('id_producto, id_categoria_producto');

        if (errorAsignaciones) {
            return res.status(500).json({ error: 'Error al obtener asignaciones de categorías: ' + errorAsignaciones.message });
        }

        // Crear un mapa de producto a categoría
        const productoCategoriaMap = {};
        asignaciones.forEach(asig => {
            productoCategoriaMap[asig.id_producto] = asig.id_categoria_producto;
        });

        // Agrupar ventas por categoría
        const ventasPorCategoria = {};
        ventasDetalles.forEach(venta => {
            const idCategoria = productoCategoriaMap[venta.id_producto];
            if (idCategoria) {
                ventasPorCategoria[idCategoria] = (ventasPorCategoria[idCategoria] || 0) + venta.cantidad;
            }
        });

        // Crear array de categorías con sus cantidades
        const categoriasConVentas = categorias.map(categoria => ({
            id: categoria.id_categoria,
            nombre: categoria.nombre_categoria,
            cantidadTotal: ventasPorCategoria[categoria.id_categoria] || 0
        }));

        // Obtener top 3 categorías
        const top3Categorias = categoriasConVentas
            .sort((a, b) => b.cantidadTotal - a.cantidadTotal)
            .slice(0, 3);

        // Formatear datos para el gráfico
        const chartData = {
            pieChartData: {
                labels: top3Categorias.map(c => c.nombre),
                datasets: [{
                    data: top3Categorias.map(c => c.cantidadTotal),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                    hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                }]
            },
            pieChartOptions: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw} unidades vendidas`;
                            }
                        }
                    }
                }
            }
        };

        res.status(200).json({
            chartData,
            topCategorias: top3Categorias
        });

    } catch (error) {
        console.error('Error en el endpoint de categorías más vendidas:', error);
        res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
};

const getUltimasVentas = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.params.id_usuario;

    try {
        // Obtener las últimas ventas CON ESTADO PAGADA
        const { data: ventas, error: errorVentas } = await supabase
            .from('Ventas')
            .select(`
                created_at,
                id_cliente,
                id_usuario,
                id_venta,
                estado
            `)
            .eq('estado', 'Pagada')  // Filtro explícito para ventas pagadas
            .order('created_at', { ascending: false })
            .limit(5);

        if (errorVentas) {
            return res.status(500).json({ error: 'Error al obtener ventas: ' + errorVentas.message });
        }

        // Obtener los datos relacionados por separado
        const ventasFormateadas = await Promise.all(ventas.map(async (venta) => {
            // Obtener datos del cliente
            const { data: cliente } = await supabase
                .from('Clientes')
                .select('nombre_completo, telefono')
                .eq('id_cliente', venta.id_cliente)
                .single();

            // Obtener datos del usuario (vendedor)
            const { data: usuario } = await supabase
                .from('Usuarios')
                .select('nombre, apellido')
                .eq('id_usuario', venta.id_usuario)
                .single();

            // Obtener datos de la factura
            const { data: factura } = await supabase
                .from('facturas')
                .select('total')
                .eq('id_venta', venta.id_venta)
                .single();

            return {
                nombre: cliente?.nombre_completo || 'Consumidor Final',
                vendedor: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'N/A',
                numero: cliente?.telefono || '0000-0000',
                fecha: venta.created_at,
                total: factura ? `L. ${factura.total.toFixed(2)}` : 'L. 0.00'
            };
        }));

        res.status(200).json({
            sales: ventasFormateadas
        });

    } catch (error) {
        console.error('Error en el endpoint de últimas ventas:', error);
        res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
};

module.exports = { getVentasEmpresa, getAlertasPorPromocionProducto, getClientesEmpresa, getAlertasPromocion, getVentasUltimosTresMeses, getCategoriasPopulares, getUltimasVentas };
