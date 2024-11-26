const cron = require("node-cron");

const { supabase } = require('../ruta/supabaseClient.js');
const { eliminarInventarioRollBackEsp, setNullRollBack } = require('../db/inventarioSvc.js');

const obtenerHoraVencida = () => {
        const ahora = new Date();
        ahora.setHours(ahora.getHours() - 2 );
        return  ahora.toISOString();
}

const getRollBacksVencidos = async () => {
    try {
        const { data: rollBacks, error } = await supabase.from('inventario_roll_back')
        .select('id_inventario_roll_back, id_inventario, cantidad, id_compra_guardada')
        .lte('created_at', obtenerHoraVencida())
        .not('id_compra_guardada', 'is', null);

        if(error){
            throw error;
        }

        return rollBacks;

    } catch (error) {
        console.error('Ocurrio un error', error.message);
        return error;
    }
}

async function eliminarCompraGuardadas(inventario) {
    try {
    const comprasGuardadas = [...new Set(inventario.map(item =>  item.id_compra_guardada ))];
    
    const eliminaciones = comprasGuardadas.map(async (compra) => {
        try {
            const { error } = await supabase.from('compras_guardada')
            .delete()
            .eq('id_compra_guardada', compra);

            if(error){
                throw error;
            }

        } catch (error) {
            console.error('Ocurrio un error en el proceso de eliminar la compra con ID: ' + compra , error);
        }

    });

    await Promise.all(eliminaciones);

    } catch (error) {
     console.error('Ocurrio un error en el proceso de eliminar una compra ', error);
    }
    
}

const restaurarInventario = async () => {
    try {
        const inventariosRB = await getRollBacksVencidos();
        if(!inventariosRB || inventariosRB.length === 0 || inventariosRB === null){
            return;
        }

        const setNulls = inventariosRB.map(async inventario => {
            const setNull = await setNullRollBack(inventario.id_compra_guardada, supabase);
            if(!setNull){
                throw 'Ocurrio un error al desanclar'
            }
        });
    
           const restauraciones = inventariosRB.map(async inventario => {
            const inventarioObject = {
                id_inventario: inventario.id_inventario
            }
               return await eliminarInventarioRollBackEsp(inventarioObject, inventario.id_inventario_roll_back, supabase)
            });

        await Promise.all(restauraciones);
        await eliminarCompraGuardadas(inventariosRB);
    } catch (error) {
        console.error('Ocurrio un error', error.message);
        return error;
    }
}

cron.schedule("5 * * * * *", async () => {
    await restaurarInventario();
});

module.exports = cron;