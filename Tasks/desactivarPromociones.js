const cron = require("node-cron");
const { supabase } = require('../ruta/supabaseClient.js');

const getPromosActivas = async () => {
    const fechaActual = new Date();
    try {
        const { data: promos, error } = await supabase.from('Producto_promocion')
        .update({estado: false})
        .lte('fecha_final', fechaActual.toISOString())
        .eq('estado', true)
        .select('id');

        if(error){
            throw error;
        }

        if(promos.length === 0){
            return { resultado: false,
                promocionesDsc: []
             }
        }

        return {resultado: true,
            promocionesDsc: promos
        };

    } catch (error) {
        console.error('Ocurrio un error: ', error);
        return { resultado: false,
            promocionesDsc: []
         };
    }
}

cron.schedule('10 1 * * *', async() => {
    try {
    const { resultado, promocionesDsc } = await getPromosActivas();
    if(resultado) {
        console.log(`Las siguientes promociones fueron desactivadas por que su fecha expiro:`);
        console.log(promocionesDsc);
    }
    } catch (error) {
        console.error('Ocurrio un error: ', error);
    }
    
});

module.exports = cron;