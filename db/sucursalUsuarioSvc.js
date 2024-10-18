const insertarRelacion = async (id_usuario, id_sucursal, supabase) => {

    try {
        const { data, error} = await supabase.from('sucursales_usuarios')
        .insert({
            id_usuario: id_usuario,
            id_sucursal: id_sucursal,
        }).select('*');

        if (error)
        {
            throw new Error('Ocurrio un error en la creacion de la relacion sucursal-usuario');
        }

        if (data.length > 0) {
            return true;}
        else {
            console.log(`Id de relacion ${data[0].id}`)
           const relacionEliminada = await deleteRelacion(data[0].id, supabase);
           if (!relacionEliminada){
            throw 'Error al eliminar relacion';
           }
            throw 'Error inesperado.'};

    } catch (error) {
        
        throw error;
    }
}

const deleteRelacion = async (id, supabase) => {
    try {
        const {data, error} = await supabase.from('sucursales_usuarios').delete().eq('id', id);
        
        if(error){
            console.log(error);
            throw error;
        }
        return true;

    } catch (error) {
        throw new Error('Fallo del servidor');
    }
}

module.exports = { insertarRelacion }