const { getEmpresaId } = require('./empresaSvc.js');
const { getSucursalesbyUser } = require('./sucursalUsuarioSvc.js');
const { getEmpresaIdbyProduct } = require('./productoSvs.js');
const { getEmpresaIdbyCategoria } = require('./catProdSvs.js');

const getAlertCeo = async(id_usuario, supabase) => {
    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        const { data: alerts, error } = await supabase.from('alerts')
        .select('id_alert, tipo, descripcion, puntaje')
        .eq('id_empresa', id_empresa);

        if(error){
            throw error;
        }

        if(alerts.length === 0 || !alerts){
            return {
                resultado: false,
                alertas: []
            }
        }

        alerts.forEach(element => {
            switch(element.tipo){
                case 'stock_minimo':
                    element.name = 'Stock Bajo';
                    break;

                case 'stock_maximo':
                    element.name = 'Stock Alto';
                    break;
                
                case 'promocion_producto_entrante':
                    element.name = 'Promoción de Producto';
                    break;

                case 'promocion_categoria_entrante':
                    element.name = 'Promoción de Categoria';
                    break;
                
                default: console.error('Ocurrio un error al mostrar una alerta', 'Tipo alerta no existe');
                break;
            }
        });

        return {
            resultado: true,
            alertas: alerts
        }

    } catch (error) {
        console.error('Ocurrio un error al definir una alerta: ', error);
        return {
            resultado: false,
            alertas: [],
            error: error
        }
    }
}

const getAlertAmdministrador = async(id_usuario, supabase) => {
    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);
        let alertas_stocks = [];
        let alertas_promos = [];
        let total_alerts = [];

const { data: id_stocks, error: errorStocks } = await supabase.from('alerts_stocks')
.select('id_alert')
.eq('id_sucursal', id_sucursal);

        if(errorStocks){
            throw errorStocks;
        }

        if(id_stocks.length !== 0 || id_stocks){
            const alertIds = id_stocks.map(stock => stock.id_alert);
            const { data, error: errorAlertsStocks } = await supabase.from('alerts')
            .select('id_alert, tipo, descripcion, puntaje')
            .in('id_alert', alertIds);
            
                    if(errorAlertsStocks){
                        throw errorAlertsStocks;
                    }

                    alertas_stocks = data;
        }
        if(errorStocks){
            throw errorStocks;
        }

        const { data: alertassinFiltro, error } = await supabase.from('alerts')
        .select('id_alert, tipo, descripcion, puntaje')
        .eq('id_empresa', id_empresa);

        if(error){
            throw error;
        }

    if(alertassinFiltro.length !== 0){

         alertas_promos = alertassinFiltro.filter(a => a.tipo === 'promocion_producto_entrante' || a.tipo === 'promocion_categoria_entrante' );
    }

    total_alerts = alertas_stocks.concat(alertas_promos);

    total_alerts.forEach(element => {
            switch(element.tipo){
                case 'stock_minimo':
                    element.name = 'Stock Bajo';
                    break;

                case 'stock_maximo':
                    element.name = 'Stock Alto';
                    break;
                
                case 'promocion_producto_entrante':
                    element.name = 'Promoción de Producto';
                    break;

                case 'promocion_categoria_entrante':
                    element.name = 'Promoción de Categoria';
                    break;
                
                default: console.error('Ocurrio un error al mostrar una alerta', 'Tipo alerta no existe');
                break;
            }
        });

        return {
            resultado: true,
            alertas: total_alerts
        }

    } catch (error) {
        console.error('Ocurrio un error al definir una alerta: ', error);
        return {
            resultado: false,
            alertas: [],
            error: error
        }
    }
}

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
            await crearAlertStockMinimo(producto, id_usuario, inventario.stock_min, inventario.stock_actual, supabase);
            return;
        }
        await eliminarProductoAlert(producto.id_producto, id_sucursal, 'stock_minimo', supabase);


    } catch (error) {
        console.error('Ocurrio un error: ', error);
    }
}

const crearAlertStockMinimo = async (producto, id_usuario, stock_min, stock_actual, supabase) => {
    try {
        
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);
        const { resultado } = await eliminarProductoAlert(producto.id_producto, id_sucursal, 'stock_minimo', supabase);

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

const eliminarProductoAlert = async (id_producto, id_sucursal, tipo, supabase) => {
    try {

        const {  data: id_alerta_exp, error: errorAlerta_exp } = await supabase.from('alerts_stocks')
        .select('id_alert')
        .eq('id_producto', id_producto)
        .eq('id_sucursal', id_sucursal);

        if(id_alerta_exp.length === 0 ){

            return { resultado: true }
        }

        if(errorAlerta_exp){
            console.log('error al obtener alerta stock');
            throw errorAlerta_exp;
        }

        const {  data: id_alerta, error: errorAlerta } = await supabase.from('alerts')
        .select('id_alert')
        .eq('id_alert', id_alerta_exp[0].id_alert)
        .eq('tipo', tipo);

        if(id_alerta_exp.length === 0 ){

            return { resultado: true }
        }

        const id_alert_selected = id_alerta[0].id_alert;
        console.log(id_alerta_exp)

        if(errorAlerta){
            console.log('error al obtener alerta general');
            throw errorAlerta;
        }

        const { error: errorStock } = await supabase.from('alerts_stocks')
        .delete()
        .eq('id_alert', id_alert_selected);

        if(errorStock){
            console.log('error al obtener alerta stock 2');
            throw errorStock;
        }

        const { error: errorAlert } = await supabase.from('alerts')
        .delete()
        .eq('id_alert', id_alert_selected)
        .eq('tipo', tipo);

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

        if((inventario.stock_actual >= inventario.stock_max)  && inventario.stock_max !== null ){

            await crearAlertStockMaximo(producto, id_usuario, inventario.stock_max, inventario.stock_actual, id_sucursal, supabase);
            return;
        }
        else{
            await eliminarProductoAlert(producto.id_producto, id_sucursal, 'stock_maximo', supabase);
        }
       
    } catch (error) {
        console.error('Ocurrio un error: ', error);
    }
}

const crearAlertStockMaximo = async (producto, id_usuario, stock_max, stock_actual, id_sucursal, supabase) => {
    try {

        const { resultado } = await eliminarProductoAlert(producto.id_producto, id_sucursal, 'stock_maximo', supabase);

        const id_empresa = await getEmpresaId(id_usuario, supabase);
        console.log(id_empresa);


    if(!resultado){
        throw 'No se puede generar nueva alerta por problemas del servidor al eliminar una alerta anterior';
    }

    const puntaje = 20;
    console.log(puntaje);


    const { data: alert, error: alertError } = await supabase.from('alerts')
    .insert({
        tipo: 'stock_maximo',
        puntaje: Math.trunc(puntaje),
        descripcion: `${producto.nombre} tiene ${stock_actual} unidades disponibles en el inventario y el stock máximo es: ${stock_max}`,
        id_empresa: id_empresa
    })
    .select('id_alert');

    if(alertError){
        throw alertError;
    }
    console.log('DAOTS');
console.log( alert[0].id_alert);
console.log(producto.id_producto);
console.log(producto.id_producto);
console.log(id_sucursal);
console.log(stock_actual);
console.log(stock_max);
console.log('DAOTS');

    const { data: alertGeneral, error: errorStock } = await supabase.from('alerts_stocks')
    .insert({
        id_alert: alert[0].id_alert,
        id_producto: producto.id_producto,
        id_sucursal: id_sucursal,
        stock_actual: stock_actual,
        stock_limite: stock_max
    })
    .select('*');

    if(errorStock){
        throw errorStock;
    }
console.log(alertGeneral);

    } catch (error) {
        console.error('Ocurrio un error: ', error);
    }
}

const crearAlertPromoProduct = async (promocion, diasRestantes, supabase) => {
    try {
        let descripcion;
        const { resultado } = await eliminarPromoAlert(promocion.id, supabase);
        const {id_empresa, resultado: existeEmpresa} = await getEmpresaIdbyProduct(promocion.producto_Id, supabase);
        if(!existeEmpresa){
            throw 'No existe este producto para una empresa';
        }

    if(!resultado){
        throw 'No se puede generar nueva alerta por problemas del servidor al eliminar una alerta anterior';
    }

    const puntaje = (10 - diasRestantes) * 10;
    if(puntaje > 100){
        return;
    }

     descripcion = `${promocion.promocion_nombre} se activara en ${diasRestantes} dias.`;
    if(puntaje === 100){
        descripcion = `${promocion.promocion_nombre} está activa.`;
    }

    const { data: alert, error: alertError } = await supabase.from('alerts')
    .insert({
        tipo: 'promocion_producto_entrante',
        puntaje: Math.trunc(puntaje),
        descripcion: descripcion,
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

const crearAlertPromoCategory = async (promocion, diasRestantes, supabase) => {
    try {
        let descripcion;
        const { resultado } = await eliminarPromoAlertCategory(promocion.id, supabase);
        const {id_empresa, resultado: existeEmpresa} = await getEmpresaIdbyCategoria(promocion.categoria_producto_Id, supabase);
        if(!existeEmpresa){
            throw 'No existe este producto para una empresa';
        }

    if(!resultado){
        throw 'No se puede generar nueva alerta por problemas del servidor al eliminar una alerta anterior';
    }

    const puntaje = (10 - diasRestantes) * 10;
    if(puntaje > 100){
        return;
    }

    descripcion = `${promocion.nombre_promocion} se activara en ${diasRestantes} dias.`;
    if(puntaje === 100){
        descripcion = `${promocion.nombre_promocion} está activa.`;
    }

    const { data: alert, error: alertError } = await supabase.from('alerts')
    .insert({
        tipo: 'promocion_categoria_entrante',
        puntaje: Math.trunc(puntaje),
        descripcion: descripcion,
        id_empresa: id_empresa
    })
    .select('id_alert');

    if(alertError){
        throw alertError;
    }

    const { error: errorPromo } = await supabase.from('alerts_promocion')
    .insert({
        id_alert: alert[0].id_alert,
        id_promocion_categoria: promocion.id,
        dias_restantes: diasRestantes
        
    });

    if(errorPromo){
        throw errorPromo;
    }

    } catch (error) {
        console.error('Ocurrio un error: ', error);
    }
}

const eliminarPromoAlertCategory = async (id_promocion, supabase) => {
    try {
        const {  data: id_alerta, error: errorAlerta } = await supabase.from('alerts_promocion')
        .select('id_alert')
        .eq('id_promocion_categoria', id_promocion);

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

module.exports = { crearAlertStockMinimo, necesitaAlertStockMin, necesitaAlertStockMax, crearAlertPromoProduct, crearAlertPromoCategory, eliminarPromoAlert, eliminarPromoAlertCategory, getAlertCeo, getAlertAmdministrador }