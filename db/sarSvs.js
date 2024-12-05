
const desactivarSar = async (id_sucursal, supabase) => {
    try {

        const { error } = await supabase.from('Datos_SAR')
        .update({
            activo: false
        })
        .eq('id_sucursal', id_sucursal);

        if (error){
            throw error;
        }

    } catch (error) {
        console.error(`Ocurrio un error al intentar desactivar datos SAR de la sucursal ${id_sucursal}`, error);
    }
}


const desactivarSarRango = async (id_sucursal, supabase) => {
    try {

        const { data, error } = await supabase.from('Datos_SAR')
        .select('*')
        .eq('id_sucursal', id_sucursal)
        .eq('activo', true)
        .single();

        if (error){
            throw error;
        }

        const rangoActual = parseInt(data.numero_actual_SAR.slice(-5), 10);
        const rangoFinal = parseInt(data.rango_final.slice(-5), 10);
        if ( rangoActual === rangoFinal){
           await desactivarSar(id_sucursal, supabase);
        }
return;
    } catch (error) {
        console.error(`Ocurrio un error al intentar desactivar datos SAR de la sucursal ${id_sucursal}`, error);
        return;
    }
}

module.exports = { desactivarSar, desactivarSarRango }