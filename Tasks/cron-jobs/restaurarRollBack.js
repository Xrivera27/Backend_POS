const cron = require("node-cron");

const { supabase } = require('../../ruta/supabaseClient.js');
const { eliminarInventarioRollBackEsp } = require('../../db/inventarioSvc.js');

const obtenerHoraVencida = () => {
        const ahora = new Date();
        ahora.setHours(ahora.getHours() - 1 );
        return  ahora.toISOString();
}

const getRollBacksVencidos = async () => {
    try {
        const { data: rollBacks, error } = await supabase.from('inventario_roll_back')
        .select('id_inventario_roll_back, id_inventario, cantidad')
        .lte('created_at', obtenerHoraVencida())
        .is('id_compra_guardada', null);

        if(error){
            throw error;
        }
        if(rollBacks.length === 0 || !rollBacks){
            return false;
        }

        return rollBacks;

    } catch (error) {
        console.error('Ocurrio un error', error.message);
        return error;
    }
}

const restaurarInventario = async () => {
    try {
        const inventariosRB = await getRollBacksVencidos();
        if(!inventariosRB || inventariosRB.length === 0 ){
            return;
        }
        
    
           const restauraciones = inventariosRB.map(inventario => {
            const inventarioObject = {
                id_inventario: inventario.id_inventario
            }
               return eliminarInventarioRollBackEsp(inventarioObject, inventario.id_inventario_roll_back, supabase)
            });

        Promise.all(restauraciones);
    } catch (error) {
        console.error('Ocurrio un error al elimnar roll back: ', error);
    }
}

cron.schedule("0 * * * *", async () => {
    await restaurarInventario();
});

module.exports = cron;