const cron = require("node-cron");
const { supabase } = require('../ruta/supabaseClient.js');

const empresas = async () => {
    try {
        const { data: empresas, error } = await supabase.from('Empresas')
        .select('*');

        if(error){
            throw error;
        }
console.log(empresas);
        return empresas;

    } catch (error) {
        console.log(error);
        return `Ocurrio un error: ${error}`;
    }
}

cron.schedule("17 22 * * * ", async () => {
    const empresasVariable = await empresas();
    console.log(empresasVariable) ;
});

module.exports = cron;