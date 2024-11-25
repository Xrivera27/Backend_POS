const cron = require("node-cron");
const { supabase } = require('../ruta/supabaseClient.js');
const { tienePromoProducto, tienePromoCategoriabyCategoria } = require('../db/promocionesSvs.js');

const activarPromosProducto = async () => {
    const fechaActual = new Date();
    let = promosDisponibles = [];
    try {
        const { data: promos, error: errorGet } = await supabase.from('Producto_promocion')
        .select('id,promocion_nombre, producto_Id')
        .lte('fecha_inicio', fechaActual.toISOString())
        .gte('fecha_final', fechaActual.toISOString())
        .eq('manejo_automatico', true)
        .eq('estado', false);

        if(errorGet){
            throw errorGet;
        }

        const filtrarPromos = promos.map(async p => {
            const existePromo = await tienePromoProducto(p.producto_Id, supabase);
            if(existePromo.promocionProducto.length > 0 || !existePromo.promocionProducto){
                console.log(existePromo);
                return p;
            }
        });

        const resultados = await Promise.all(filtrarPromos);

        const promosDisponibles = resultados.filter((p) => p !== null);
        
        return {
            promosProducto: promosDisponibles,
            resultado: true,
            message: 'Exitoso'
        }

    } catch (error) {
        return {
            resultado: false,
            message: error
        }
    }
}

const activarPromosCategoria = async () => {
    const fechaActual = new Date();
    try {
        const { data: promos, error: errorGet } = await supabase.from('categoria_promocion')
        .select('id,nombre_promocion, categoria_producto_Id')
        .lte('fecha_inicio', fechaActual.toISOString())
        .gte('fecha_final', fechaActual.toISOString())
        .eq('manejo_automatico', true)
        .eq('estado', false);

        if(errorGet){
            throw errorGet;
        }

        return {
            promosCategoria: promos,
            resultado: true,
            message: 'Exitoso'
        }

    } catch (error) {
        return {
            resultado: false,
            message: error
        }
    }
}

cron.schedule('* 1 * * * *', async () => {
    try {
        const getPromos = [
            activarPromosProducto(),
            activarPromosCategoria()
        ];
    const promociones = await Promise.all(getPromos);

    const { promosProducto, resultado: resultProduct, message: messProduct } = promociones[0];
    const { promosCategoria, resultado: resultCategory, message: messCategory } = promociones[1];
    
    if(resultProduct && promosProducto.length > 0){
        console.log(promosProducto);
    }

    if(resultCategory && promosCategoria.length > 0){
        console.log(promosCategoria);
    }

    if(!resultProduct){
        throw messProduct;
    }

    if(!resultCategory){
        throw messCategory;
    }

    } catch (error) {
        console.error('Ocurrio un error', error);
    }
    
});

module.exports = cron;