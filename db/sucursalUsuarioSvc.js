//Para obtener el id de la sucursal mediante el usuario  

const getSucursalesbyUser = async (id_usuario, supabase) => {
    try {

        const { data: sucursales, error} = await supabase
        .from('sucursales_usuarios')
        .select('id_sucursal')
        .eq('id_usuario', id_usuario)
        .single();

        if (error) {
            console.log(error);
            throw 'Ocurrio un error al obtener sucursales de Usuario';
        }

        // console.log(`Usuario ${id_usuario} ${sucursales}`);
        if (sucursales.length > 1){
            throw 'Se esperaba un unico registro';
        }

        return sucursales.id_sucursal;

    } catch (error) {
        throw new Error(error);
    }
}

const getIdUsersBySucursal = async (id_sucursal, supabase) => {
    try {
        const { data: ids, error } = await supabase.from('sucursales_usuarios')
        .select('id_usuario')
        .eq('id_sucursal', id_sucursal);

        if (error){
            throw error;
        }

        return {
            resultado: true,
            ids: ids
        }

    } catch (error) {
        console.error('Ha ocurrido un error: ', error);
        return {
            resultado: false,
            ids: []
        }
    }
}

const getIdCajeroBySucursal = async (id_sucursal, supabase) => {
    try {
        const { data: ids, error } = await supabase.from('sucursales_usuarios')
        .select('id_usuario, Usuarios(id_usuario, id_rol, nombre, apellido, estado)')
        .eq('Usuarios.id_rol', 3)
        .eq('Usuarios.estado', true)
        .eq('id_sucursal', id_sucursal);

        if(ids.length < 1 ){
            return;
        }

        const newIds = ids.filter(u => u.Usuarios !== null);
        const idsFixed = [];

        newIds.forEach(i => {
            idsFixed.push({
                id_usuario: i.id_usuario,
                nombre: i.Usuarios.nombre,
                apellido: i.Usuarios.apellido
            });
        });
        

        if (error){
            throw error;
        }

        return {
            resultado: true,
            ids: idsFixed
        }

    } catch (error) {
        console.error('Ha ocurrido un error: ', error);
        return {
            resultado: false,
            ids: []
        }
    }
}

const verificarPasswordAdmin = async (id_sucursal, passwordTry, supabase) => {
    try {
        const { data: ids, error } = await supabase.from('sucursales_usuarios')
        .select('id_usuario, Usuarios(id_usuario, id_rol, nombre, apellido, contraseña, estado)')
        .eq('Usuarios.id_rol', 1)
        .eq('Usuarios.estado', true)
        .eq('id_sucursal', id_sucursal);

        if(ids.length < 1 ){
            return {
                resultado: false
            };
        }

        const newIds = ids.filter(u => u.Usuarios !== null && u.Usuarios.contraseña === passwordTry );

        if(newIds.length < 1){
            return {
                resultado: false
            };
        }
        
        if (error){
            throw error;
        }

      return {
            resultado: true
        };

    } catch (error) {
        console.error('Ha ocurrido un error: ', error);
        return {
            resultado: false,
            error: error
        };
    }
}

const existeRelacion = async (id_usuario, id_sucursal, supabase) => {
try {
    const { data, error } = await supabase.from('sucursales_usuarios')
    .select('id')
    .eq('id_usuario', id_usuario)
    .eq('id_sucursal', id_sucursal);

    if(error){
        throw error;
    }

    return {
        resultado: true,
        id_relacion: data
    }

} catch (error) {
    return {
        resultado: false,
        id_relacion: null
    }
}
}

const getDatosSarSucursal = async (id_usuario, supabase) => {

    try {
        
        const id_sucursal = await getSucursalesbyUser(id_usuario, supabase); 

        const { data: datosSar, error } = await supabase
            .from('Datos_SAR')
            .select('*')
            .eq('id_sucursal', id_sucursal)
            .eq('activo', true)
            .single();

        if (!datosSar || datosSar.length === 0) { 
            console.error('No hay registro válido de la sucursal en SAR');
            throw 'No hay registro válido de la sucursal en SAR';
        }

       // const {error: errorAumentarSar } = await supabase.rpc('aumentar_actual_SAR',{id_sucursal_param: id_sucursal});

        if (error) {
            console.error('Ocurrió un error', error);
            throw 'Ocurrió un error al obtener datos SAR de la sucursal';
        }

        return datosSar;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const insertarRelacion = async (id_usuario, id_sucursal, supabase) => {

    try {
        const { data, error} = await supabase.from('sucursales_usuarios')
        .insert({
            id_usuario: id_usuario,
            id_sucursal: id_sucursal,
        }).select('*');

        if (error)
        {
            return 'Ocurrio un error en la creacion de la relacion sucursal-usuario';
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

module.exports = { existeRelacion, insertarRelacion, getSucursalesbyUser, getIdUsersBySucursal, getIdCajeroBySucursal, getDatosSarSucursal, verificarPasswordAdmin }