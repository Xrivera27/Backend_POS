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

const existeInventario = async (id_producto, id_sucursal, supabase) => {
    try {
        const { data: inventario, error } = await supabase.from('inventarios')
        .select('id_inventario')
        .eq('id_producto', id_producto)
        .eq('id_sucursal', id_sucursal)
        .single();

        if (inventario){
            return inventario.id_inventario;
        }

        return false;

    } catch (error) {
        return new Error(`Ocurrio un error: ${error}`);
    }
}

const esMismaEmpresa = async (id_producto, id_sucursal, supabase) => {
    try {
       
        const { data: id_empresaProducto, error: errorProducto } = await supabase
            .from('producto')
            .select('id_empresa')
            .eq('id_producto', id_producto)
            .single();

        if (errorProducto) {
            throw new Error(`Error al obtener la empresa del producto: ${errorProducto.message}`);
        }

     
        const { data: id_empresaSucursal, error: errorSucursal } = await supabase
            .from('Sucursales')
            .select('id_empresa')
            .eq('id_sucursal', id_sucursal)
            .single();

        if (errorSucursal) {
            throw new Error(`Error al obtener la empresa de la sucursal: ${errorSucursal.message}`);
        }

        return id_empresaProducto.id_empresa === id_empresaSucursal.id_empresa;

    } catch (error) {
        console.error('Error en esMismaEmpresa:', error);
        return false; 
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

const getRolByUsuario = async (id_usuario, supabase) => {
    try {
        const { data: id_rol, error } = await supabase
            .from('Usuarios')
            .select('id_rol')
            .eq('id_usuario', id_usuario)
            .single(); 
        
        if (error) throw error;

        return id_rol.id_rol;
    } catch (error) {
        console.error('Error al obtener el rol:', error);
        return null;
    }
}


module.exports = { existenciProductCode, existeIdinTable, getRolByUsuario, existeInventario, esMismaEmpresa }


