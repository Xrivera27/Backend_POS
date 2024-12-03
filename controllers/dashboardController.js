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

module.exports = { getVentasEmpresa, getAlertasPorPromocionProducto, getClientesEmpresa, getAlertasPromocion, getVentasUltimosTresMeses };
