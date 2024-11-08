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

        return inventario.id_inventario;

    } catch (error) {
        console.error("Error en reducirInventario:", error.message);
        return false; // Devolvemos false en caso de error
    }
};

const verificarInventarioRollBack = async (id_producto, id_usuario, supabase) => {
    try {
        const { data: inventario, error } = await supabase
            .from('inventario_roll_back')
            .select('id_inventario_roll_back, cantidad')
            .eq('id_producto', id_producto)
            .eq('id_usuario', id_usuario)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignora el error cuando no se encuentran registros
            throw new Error("Ocurrió un error al verificar el inventario rollback: " + error.message);
        }

        return inventario || null; // Devuelve el registro o `null` si no existe
    } catch (error) {
        console.error("Error en verificar inventario rollback:", error.message);
        return null;
    }
};

const addInventarioRollBack = async (id_producto, id_usuario, cantidad, supabase) => {
    try {
        const inventarioExistente = await verificarInventarioRollBack(id_producto, id_usuario, supabase);

        if (inventarioExistente) {
            // Actualiza la cantidad sumando la cantidad existente y la nueva cantidad
            const nuevaCantidad = inventarioExistente.cantidad + cantidad;

            const { error } = await supabase.from('inventario_roll_back')
                .update({ cantidad: nuevaCantidad })
                .eq('id_inventario_roll_back', inventarioExistente.id_inventario_roll_back);

            if (error) {
                throw new Error("Ocurrió un error al actualizar la cantidad en inventario rollback: " + error.message);
            }

        } else {
            // Inserta un nuevo registro si no existe
            const { error } = await supabase.from('inventario_roll_back').insert({
                id_producto: id_producto,
                id_usuario: id_usuario,
                cantidad: cantidad
            });

            if (error) {
                throw new Error("Ocurrió un error al insertar en inventario rollback: " + error.message);
            }
        }

        return true;
    } catch (error) {
        console.error("Error en agregar inventario rollback:", error.message);
        return false;
    }
};

// const reducirInventarioRollBack = async (id_producto, id_usuario, cantidad, supabase) => {
//     try {
//         const inventarioExistente = await verificarInventarioRollBack(id_producto, id_usuario, supabase);

//         if(!inventarioExistente){

//         }

//     } catch (error) {
        
//     }
// }

const eliminarInventarioRollBack = async (productos, id_usuario, supabase) => {
    try {
        const deleteInventarioRoll = productos.map(producto => 
            supabase
                .from('inventario_roll_back')
                .delete() // Corregido aquí
                .eq('id_usuario', id_usuario)
                .eq('id_producto', producto.id_producto)
        ); 
 
        const resultado = await Promise.all(deleteInventarioRoll);
        resultado.forEach(({ error }, index) =>  {
            if (error) {
                console.error(`Error al eliminar el producto con ID ${productos[index].id_producto}:`, error);
            }
        });
    } catch (error) {
        console.error("Error en el proceso de eliminación:", error);
    }
 };
 

module.exports = { postFirstinventario, buscarProductoInventario, reducirInventario, addInventarioRollBack, eliminarInventarioRollBack }