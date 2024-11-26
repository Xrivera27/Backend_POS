const { getEmpresaId } = require('./empresaSvc.js');
const { getSucursalesbyUser } = require('./sucursalUsuarioSvc.js');
const { getEmpresaIdbyProduct } = require('./productoSvs.js');

const necesitaAlertStockMin = async (producto, id_usuario, supabase) => {
    try {
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

        const { data: inventario, error } = await supabase.from('inventarios')
        .select('stock_min, stock_actual')
        .eq('id_producto', producto.id_producto)
        .eq('id_sucursal', id_sucursal)
        .single();

        if(error){
            throw error;
        }

        if(inventario.stock_actual < (inventario.stock_min * 0.50) + inventario.stock_min){
            await crearAlertStockMinimo(producto, id_usuario, inventario.stock_min, inventario.stock_actual, supabase)
        }

    } catch (error) {
        console.error('Ocurrio un error: ', error);
    }
}

const crearAlertStockMinimo = async (producto, id_usuario, stock_min, stock_actual, supabase) => {
    try {
        const { resultado } = await eliminarProductoAlert(producto.id_producto, supabase);
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

    if(!resultado){
        throw 'No se puede generar nueva alerta por problemas del servidor al eliminar una alerta anterior';
    }

    const puntaje = generarPuntajeStockMin(stock_actual, stock_min);

    const { data: alert, error: alertError } = await supabase.from('alerts')
    .insert({
        tipo: 'stock_minimo',
        puntaje: Math.trunc(puntaje),
        descripcion: `${producto.nombre} tiene ${stock_actual} unidades disponibles en el inventario y el stock minimo es: ${stock_min}`,
        id_empresa: id_empresa
    })
    .select('id_alert');

    if(alertError){
        throw alertError;
    }

    const { error: errorStock } = await supabase.from('alerts_stocks')
    .insert({
        id_alert: alert[0].id_alert,
        id_producto: producto.id_producto,
        id_sucursal: id_sucursal,
        stock_actual: stock_actual,
        stock_limite: stock_min
    });

    if(errorStock){
        throw errorStock;
    }

    } catch (error) {
        console.error('Ocurrio un error: ', error);
    }
}

const generarPuntajeStockMin = (stock_actual, stock_min) => {
    if (stock_actual < stock_min){
        return 100;
    }

    const diferencia = stock_actual - stock_min;
    const rango_critico = stock_min * 0.50;

    const porcentajePunaje = 1 - (diferencia/rango_critico);
    return porcentajePunaje * 100; 

}

const eliminarProductoAlert = async (id_producto, supabase) => {
    try {
        const {  data: id_alerta, error: errorAlerta } = await supabase.from('alerts_stocks')
        .select('id_alert')
        .eq('id_producto', id_producto);

        if(id_alerta.length === 0){
            return {
                resultado: true
            }
        }

        const id_alert_selected = id_alerta[0].id_alert;

        if(errorAlerta){
            throw errorAlerta;
        }

        const { error: errorStock } = await supabase.from('alerts_stocks')
        .delete()
        .eq('id_alert', id_alert_selected);

        if(errorStock){
            throw errorStock;
        }

        const { error: errorAlert } = await supabase.from('alerts')
        .delete()
        .eq('id_alert', id_alert_selected);

        if(errorAlert){
            throw errorAlert;
        }
        
        return {
            resultado: true
        }

    } catch (error) {
        console.error('Ocurrio un error al eliminar alerta: ', error);
        return {
            resultado: false
        }
    }
}

const necesitaAlertStockMax = async (producto, id_usuario, supabase) => {
    try {
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

        const { data: inventario, error } = await supabase.from('inventarios')
        .select('stock_max, stock_actual')
        .eq('id_producto', producto.id_producto)
        .eq('id_sucursal', id_sucursal)
        .single();

        if(error){
            throw error;
        }

        if(inventario.stock_actual >= inventario.stock_max ){
            await crearAlertStockMaximo(producto, id_usuario, inventario.stock_max, inventario.stock_actual, supabase)
        }

    } catch (error) {
        console.error('Ocurrio un error: ', error);
    }
}

const crearAlertStockMaximo = async (producto, id_usuario, stock_max, stock_actual, supabase) => {
    try {
        const { resultado } = await eliminarProductoAlert(producto.id_producto, supabase);
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

    if(!resultado){
        throw 'No se puede generar nueva alerta por problemas del servidor al eliminar una alerta anterior';
    }

    const puntaje = 20;

    const { data: alert, error: alertError } = await supabase.from('alerts')
    .insert({
        tipo: 'stock_maximo',
        puntaje: Math.trunc(puntaje),
        descripcion: `${producto.nombre} tiene ${stock_actual} unidades disponibles en el inventario y el stock maximo es: ${stock_max}`,
        id_empresa: id_empresa
    })
    .select('id_alert');

    if(alertError){
        throw alertError;
    }

    const { error: errorStock } = await supabase.from('alerts_stocks')
    .insert({
        id_alert: alert[0].id_alert,
        id_producto: producto.id_producto,
        id_sucursal: id_sucursal,
        stock_actual: stock_actual,
        stock_limite: stock_max
    });

    if(errorStock){
        throw errorStock;
    }

    } catch (error) {
        console.error('Ocurrio un error: ', error);
    }
}

const crearAlertPromoProduct = async (promocion, diasRestantes, supabase) => {
    try {
        const { resultado } = await eliminarPromoAlert(promocion.id, supabase);
        const {id_empresa, resultado: existeEmpresa} = await getEmpresaIdbyProduct(promocion.producto_Id, supabase);
        if(!existeEmpresa){
            throw 'No existe este producto para una empresa';
        }

    if(!resultado){
        throw 'No se puede generar nueva alerta por problemas del servidor al eliminar una alerta anterior';
    }

    const puntaje = diasRestantes * 10;

    const { data: alert, error: alertError } = await supabase.from('alerts')
    .insert({
        tipo: 'promocion_producto_entrante',
        puntaje: Math.trunc(puntaje),
        descripcion: `${promocion.promocion_nombre} se activara en ${diasRestantes} dias.`,
        id_empresa: id_empresa
    })
    .select('id_alert');

    if(alertError){
        throw alertError;
    }

    const { error: errorPromo } = await supabase.from('alerts_promocion')
    .insert({
        id_alert: alert[0].id_alert,
        id_promocion_producto: promocion.id,
        dias_restantes: diasRestantes
        
    });

    if(errorPromo){
        throw errorPromo;
    }

    } catch (error) {
        console.error('Ocurrio un error: ', error);
    }
}

const eliminarPromoAlert = async (id_promocion, supabase) => {
    try {
        const {  data: id_alerta, error: errorAlerta } = await supabase.from('alerts_promocion')
        .select('id_alert')
        .eq('id_promocion_producto', id_promocion);

        if(id_alerta.length === 0){
            return {
                resultado: true
            }
        }

        const id_alert_selected = id_alerta[0].id_alert;

        if(errorAlerta){
            throw errorAlerta;
        }

        const { error: errorPromo } = await supabase.from('alerts_promocion')
        .delete()
        .eq('id_alert', id_alert_selected);

        if(errorPromo){
            throw errorPromo;
        }

        const { error: errorAlert } = await supabase.from('alerts')
        .delete()
        .eq('id_alert', id_alert_selected);

        if(errorAlert){
            throw errorAlert;
        }
        
        return {
            resultado: true
        }

    } catch (error) {
        console.error('Ocurrio un error al eliminar alerta: ', error);
        return {
            resultado: false
        }
    }
}

module.exports = { crearAlertStockMinimo, necesitaAlertStockMin, necesitaAlertStockMax, crearAlertPromoProduct }