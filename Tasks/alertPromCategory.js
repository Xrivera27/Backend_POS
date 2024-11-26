const cron = require("node-cron");
const { supabase } = require('../ruta/supabaseClient.js');
const {crearAlertPromoCategory} = require('../db/alerts.js');

const getProximasAlerts = async() => {
const fechaActual = new Date();
const fechaDentroDe10Dias = new Date();
fechaDentroDe10Dias.setDate(fechaActual.getDate() + 10);

try {
    const { data: promos, error: errorGet } = await supabase.from('categoria_promocion')
        .select('id, nombre_promocion, categoria_producto_Id, fecha_inicio')
        .gte('fecha_inicio', fechaActual.toISOString())
        .lte('fecha_inicio', fechaDentroDe10Dias.toISOString()) 
        .eq('manejo_automatico', true)
        .eq('estado', false);

    if (errorGet) {
        throw errorGet;
    }

    promos.map(async (p) => {
       const diasRestantes = (calcularDiasFaltantes(fechaActual, p.fecha_inicio));
       if( diasRestantes <= 10 ){
        await crearAlertPromoCategory(p, diasRestantes, supabase);
       }
    });

    console.log(promos);
    
} catch (error) {
    console.error('Error al obtener promociones:', error);
}
}

function calcularDiasFaltantes(fechaActual, fechaInicioPromo) {

    const fechaActualObj = new Date(fechaActual);
    const fechaInicioObj = new Date(fechaInicioPromo);

    const diferenciaMilisegundos = fechaInicioObj - fechaActualObj;

    const diasFaltantes = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));

    return diasFaltantes;
}

cron.schedule('10 2 * * *', async() => {
    await getProximasAlerts();
});

module.export = cron;
