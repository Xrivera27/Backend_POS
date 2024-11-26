const cron = require("node-cron");
const { supabase } = require('../ruta/supabaseClient.js');
const { tienePromoProducto, tienePromoCategoriabyCategoria } = require('../db/promocionesSvs.js');

const activarPromosProducto = async () => {
    const fechaActual = new Date();
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
        const totalPromos = promos.map(async (p) => {
            try {
                const { resultado } = await tienePromoProducto(p.producto_Id, supabase);
                if(resultado){
                    
                    return null;
                }

                return p;
            } catch (error) {
                console.log(error);
                return error;
            }
        });

        const promosFiltrados = await Promise.all(totalPromos);
        const sinNull = promosFiltrados.filter(p => p !== null);

        if(!sinNull || sinNull.length === 0 || sinNull === null){

            return {
                promosProducto: [],
            resultado: true,
            message: 'No hay promociones disponibles para activar'
            }
        }

        const activarPromos = sinNull.map(async (p) => {
            const { data: promoActivada, error: errorAct } = await supabase.from('Producto_promocion')
            .update({
                estado: true
            })
            .eq('id', p.id)
            .select('id, promocion_nombre');

            if( errorAct){
                throw errorAct;
            }

            return promoActivada;
        });

        const promosActivadas = await Promise.all(activarPromos);
        
        return {
            promosProducto: promosActivadas,
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
        .select('id, nombre_promocion, categoria_producto_Id')
        .lte('fecha_inicio', fechaActual.toISOString())
        .gte('fecha_final', fechaActual.toISOString())
        .eq('manejo_automatico', true)
        .eq('estado', false);

        if(errorGet){
            throw errorGet;
        }

        const totalPromos = promos.map(async (p) => {
            try {
                const { resultado } = await tienePromoCategoriabyCategoria(p.categoria_producto_Id, supabase);
                if(resultado){
                    return null;
                }

                return p;
            } catch (error) {
                console.log(error);
                return error;
            }
        });

        const promosFiltrados = await Promise.all(totalPromos);
        const sinNull = promosFiltrados.filter(p => p !== null);

        if(!sinNull || sinNull.length === 0 || sinNull === null){

            return {
                promosCategoria: [],
            resultado: true,
            message: 'No hay promociones disponibles para activar'
            }
        }


        const activarPromos = sinNull.map(async (p) => {
            const { data: promoActivada, error: errorAct } = await supabase.from('categoria_promocion')
            .update({
                estado: true
            })
            .eq('id', p.id)
            .select('id, nombre_promocion');

            if( errorAct){
                throw errorAct;
            }

            return promoActivada;
        });

        const promosActivadas = await Promise.all(activarPromos);

        return {
            promosCategoria: promosActivadas,
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

cron.schedule('50 1 * * *', async () => {
    try {
        const getPromos = [
            activarPromosProducto(),
            activarPromosCategoria()
        ];
    const promociones = await Promise.all(getPromos);

    const { promosProducto, resultado: resultProduct, message: messProduct } = promociones[0];
    const { promosCategoria, resultado: resultCategory, message: messCategory } = promociones[1];

    if(resultProduct && promosProducto.length > 0){
        console.log('Se activaron las siguientes promociones de producto:');
        console.log(promosProducto);
    }

    if(resultCategory && promosCategoria.length > 0){
        console.log('Se activaron las siguientes promociones de Categoria:');
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