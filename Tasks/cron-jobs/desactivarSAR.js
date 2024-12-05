const cron = require("node-cron");
const { supabase } = require('../../ruta/supabaseClient.js');

const desactivarSar = async () => {
    const fechaActual = new Date();
    try {
        const { data: sar, error } = await supabase.from('Datos_SAR')
        .update({activo: false})
        .lte('fecha_vencimiento', fechaActual.toISOString())
        .eq('activo', true)
        .select('id');

        if(error){
            throw error;
        }

        if(sar.length === 0){
            return { resultado: false,
                datosSar: []
             }
        }

        return {resultado: true,
            datosSar: sar
        };

    } catch (error) {
        console.error('Ocurrio un error: ', error);
        return { resultado: false,
            datosSar: []
         };
    }
}

async function mostrarResultado() {
    try {
        const { resultado, datosSar } = await desactivarSar();
        if(resultado) {
            console.log(`Las siguientos id de datos SAR fueron desactivados por que su fecha expiró:`);
            console.log(datosSar);
        }
        } catch (error) {
            console.error('Ocurrio un error: ', error);
        }
}

cron.schedule('10 0 * * *', async() => {
    await mostrarResultado();
});

module.exports = { cron, mostrarResultado };