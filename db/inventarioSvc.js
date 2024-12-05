//Funciones relacionadas con inventario para que no esten en controller 

const { getSucursalesbyEmpresa } = require('./empresaSvc.js');

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

const postInventarioEmpresas = async (id_producto, id_empresa, supabase) => {
    try {
       const id_sucursales = await getSucursalesbyEmpresa(id_empresa, supabase);
  
       const promesas = id_sucursales.map(async (s) => {
        const { resultado, error } = await postFirstinventario(id_producto, s.id_sucursal, supabase);

        if(!resultado)
            throw error;
       });

       await Promise.all(promesas);

    } catch (error) {
        throw new Error(error);
    }
}

const postFirstinventario = async (id_producto, id_sucursal, supabase) => {
    try {
        console.log('sucursales');
        console.log(id_sucursal);
        const { data: inventario, error } = await supabase
        .from('inventarios')
        .insert({
            id_producto: id_producto,
            id_sucursal: id_sucursal
        }).select('id_inventario');

        if (error) {
            throw 'Error al intentar agregar producto a inventario';
        }
        console.log(inventario);

        return {inventario,
resultado: true
        };

    } catch (error) {
        console.error('Ocurrio un error al agregar productos a las sucursales', error);
        return { error, resultado: false }
    }
}

const buscarProductoInventario = async (id_producto, id_sucursal, supabase) => {
    try {
        const { data: inventario, error } = await supabase.from('inventarios')
        .select('id_inventario, stock_actual')
        .eq('id_producto', id_producto)
        .eq('id_sucursal', id_sucursal)
        .single();

        if (inventario){
            return inventario;
        }

        if(error){
            throw error;
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

        const { error } = await supabase.rpc('reducir_stock', {id_inventario_param: inventario.id_inventario, cantidad: cantidad});

        if (error) {
            throw new Error("Ocurrió un error al actualizar inventario: " + error.message);
        }

        return inventario.id_inventario;

    } catch (error) {
        console.error("Error en reducirInventario:", error.message);
        return false; // Devolvemos false en caso de error
    }
};

const aumentarInventario = async (inventario, cantidad, supabase) => {
    try {
        // Usar RPC para asegurar la atomicidad de la operación
        const { error } = await supabase.rpc('aumentar_stock', {
            id_inventario_param: inventario.id_inventario,
            cantidad: cantidad
        });

        if (error) {
            console.error('Error en aumentar_stock:', error);
            throw new Error(`Error al actualizar inventario: ${error.message}`);
        }

        return true;
    } catch (error) {
        console.error("Error en aumentarInventario:", error);
        throw error;
    }
};

const verificarInventarioRollBack = async (id_inventario, id_usuario, supabase) => {
    try {
        const { data: inventario, error } = await supabase
            .from('inventario_roll_back')
            .select('id_inventario_roll_back, cantidad')
            .eq('id_inventario', id_inventario)
            .eq('id_usuario', id_usuario)
            .is('id_compra_guardada', null)
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

const addInventarioRollBack = async (id_inventario, id_usuario, cantidad, supabase) => {
    try {
        const inventarioExistente = await verificarInventarioRollBack(id_inventario, id_usuario, supabase);

        if (inventarioExistente) {
            
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
                id_inventario: id_inventario,
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

const eliminarInventarioRollBack = async (id_usuario, supabase) => {
    try {
       
        const { error } = await supabase
            .from('inventario_roll_back')
            .delete()
            .eq('id_usuario', id_usuario)
            .is('id_compra_guardada', null);

        if (error) {
            throw error;
        } else {
            return {
                message: `Se elimino el inventario reservado`,
                resultado: true
            }
        }
    } catch (error) {
        return {
            message: `No se pudo eliminar el inventario temporal: ${error}`,
            resultado: false
        }
    }
};

const eliminarInventarioRollBackEsp = async (inventario, id_inventario_roll_back, supabase) => {
    try {
        
        const { data: inventarioRB, error: errorGet } = await supabase.from('inventario_roll_back')
        .select('cantidad')
        .eq('id_inventario_roll_back', id_inventario_roll_back)
        .single();

        const { error } = await supabase
            .from('inventario_roll_back')
            .delete()
            .eq('id_inventario_roll_back', id_inventario_roll_back)
            .is('id_compra_guardada', null);


        if (error || errorGet) {
            console.error(`Error al eliminar los registros de inventario para el inventario roll back ${id_inventario_roll_back}:`, error);
        } else {
            console.log(`Registros de inventario eliminados exitosamente para el inventario ${id_inventario_roll_back}.`);
            await aumentarInventario(inventario, inventarioRB.cantidad, supabase);
            return inventario.cantidad;
        }
    } catch (error) {
        console.error("Error en el proceso de eliminación:", error);
    }
}

const eliminarCompraGuardada = async (id_compra_guardada, supabase) => {
    try {
        
        const { error } = await supabase.from('compras_guardada')
        .delete()
        .eq('id_compra_guardada', id_compra_guardada);
        
        if (error) {
            console.error(`Error al eliminar los registros de compra guardada con el id: ${id_compra_guardada}:`, error);
            throw 'Ocurrio un error, por favor intente de nuevo';
        } else {
            return true;
        }
    } catch (error) {
        console.error("Error en el proceso de eliminación:", error);
        return false;
    }
}

const setNullRollBack = async (id_compra_guardada, supabase) => {
    try {
        
        const { error } = await supabase.from('inventario_roll_back')
        .update({
            id_compra_guardada: null
        })
        .eq('id_compra_guardada', id_compra_guardada);
        
        if (error) {
            console.error(`Error al set como null id_compra_guardada al recuperar compra: `, error);
            throw 'Ocurrio un error, por favor intente de nuevo';
        } else {
            return true;
        }
    } catch (error) {
        console.error("Error en el proceso de set:", error);
        return false;
    }
}

module.exports = { 
    postFirstinventario,
    postInventarioEmpresas,
    buscarProductoInventario, 
    reducirInventario,
    aumentarInventario,  // Añadir esta línea
    verificarInventarioRollBack, 
    addInventarioRollBack, 
    eliminarInventarioRollBack, 
    eliminarInventarioRollBackEsp,
    setNullRollBack,
    eliminarCompraGuardada
}