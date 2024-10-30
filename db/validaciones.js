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

const existeIdinTable = async (id, id_table, tabla, supabase) => {
    try {
        const { data, error } = await supabase
            .from(tabla)
            .select('*')
            .eq(id_table, id);

        if (error) {
            throw new Error('Error al consultar la base de datos');
        }

        if (!data || data.length === 0) {
            throw new Error('No se encontraron registros.');
        }

        // Si el registro existe, devuelve true
        return true;
    } catch (error) {
        return error.message; // Retorna solo el mensaje del error
    }
}

module.exports = { existenciProductCode, existeIdinTable }


