const getInventario = async (id_producto, id_sucursal, supabase) => {
    try {

        const { data: inventario, error } = await supabase
            .from('inventarios')
            .select('id_inventario, stock_actual')
            .eq('id_sucursal', id_sucursal)
            .eq('id_producto', id_producto)
            .single();

        
        if (error) {
            console.error("Error fetching inventory:", error.message);
            throw new Error("No se pudo obtener el inventario. Intenta de nuevo.");
        }

        return inventario;
        
    } catch (error) {
        console.error("Unexpected error:", error);
        throw new Error("Hubo un error inesperado al obtener el inventario.");
    }
};


const postFirstinventario = async (id_producto, id_sucursal, supabase) => {
    try {
        const { data: inventario, error } = supabase
        .from('inventarios')
        .insert({
            id_producto: id_producto,
            id_sucursal: id_sucursal
        }).select('id_inventario');

        if (error) {
            throw 'Error al intentar agregar producto a inventario';
        }

        return inventario;

    } catch (error) {
        throw new Error(error);
    }
}

const buscarProductoInventario = async (id_producto, id_sucursal, supabase) => {
    try {
        const { data: producto, error } = await supabase.from('inventarios')
        .select('id_producto')
        .eq('id_producto', id_producto)
        .eq('id_sucursal', id_sucursal)
        .single();

        if (producto){
            return true;
        }

        else return false;

    } catch (error) {
        console.log('Error buscando producto: ' +error);
        return new Error(error);
    }
}

const reducirInventario = async (id_producto, id_sucursal, cantidad, supabase) => {
    try {
        const inventario = await getInventario(id_producto, id_sucursal, supabase);

        if (!inventario) {
            throw new Error("Inventario no encontrado");
        }

        if (cantidad > inventario.stock_actual) {
            throw new Error("No hay suficiente stock en el inventario");
        }

        const { error } = await supabase
            .from('inventarios')
            .update({
                stock_actual: inventario.stock_actual - cantidad
            })
            .eq('id_inventario', inventario.id_inventario);

        if (error) {
            throw new Error("Ocurrió un error al actualizar inventario: " + error.message);
        }

        return true;

    } catch (error) {
        console.error("Error en reducirInventario:", error.message);
        return false; // Devolvemos false en caso de error
    }
};


module.exports = { postFirstinventario, buscarProductoInventario, reducirInventario }