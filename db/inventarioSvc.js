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

module.exports = { postFirstinventario }