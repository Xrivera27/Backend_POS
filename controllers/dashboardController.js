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


const getComprasPendientes = async (req, res) => {
    const supabase = req.supabase;
    try {
        const { data: comprasPendientes, error } = await supabase
        .from('compras')
        .select('*')
        .eq('estado', 'pendiente');

        if (error) {
            return res.status(500).json({ error: 'Error al obtener compras pendientes: ' + error.message });
        }

        res.status(200).json(comprasPendientes);
    } catch (error) {
        console.error('Error en el endpoint de compras pendientes:', error);
        res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
};

const getClientes = async (req, res) => {
    const supabase = req.supabase;
    try {
        const { data: clientes, error } = await supabase
        .from('clientes')
        .select('id_cliente, nombre, email, telefono');

        if (error) {
            return res.status(500).json({ error: 'Error al obtener clientes: ' + error.message });
        }

        res.status(200).json(clientes);
    } catch (error) {
        console.error('Error en el endpoint de clientes:', error);
        res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
};

const getAlertas = async (req, res) => {
    const supabase = req.supabase;
    try {
        const { data: alertas, error } = await supabase
        .from('alertas')
        .select('id_alerta, mensaje, tipo, fecha')
        .order('fecha', { ascending: false });

        if (error) {
            return res.status(500).json({ error: 'Error al obtener alertas: ' + error.message });
        }

        res.status(200).json(alertas);
    } catch (error) {
        console.error('Error en el endpoint de alertas:', error);
        res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
};

module.exports = { getVentasEmpresa, getComprasPendientes, getClientes, getAlertas };
