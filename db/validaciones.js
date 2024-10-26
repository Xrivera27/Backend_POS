const existenciProductCode = async (tabla, campo, atributo, id_empresa, supabase) => {
    try {
        const { data: existencia, error } = await supabase
            .from(tabla)
            .select(campo)
            .eq('id_empresa', id_empresa)
            .eq(campo, atributo)
            .select('codigo_producto');

        if (error) {

            throw 'Error al consultar la base de datos:'; 
        }

        if(existencia.length > 0){

            return true;
        }

        else {
            return false;
        }

    } catch (error) {
        
        console.error('Error en la función validarExistencia:', error);
        throw new Error(error);
    }
}

module.exports = { existenciProductCode }


