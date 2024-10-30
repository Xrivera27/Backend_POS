const { existeIdinTable } = require('./validaciones.js');

const catProdAdd = async (categorias, id_producto, supabase) => {

let arrayErrores = [];

    for (let i = 0; i < categorias.length; i ++){
        const existeCategoria = await existeIdinTable(categorias[i], 'id_categoria', 'categoria_producto', supabase);

        if ( existeCategoria !== true  ){
            console.log(`No existe la categoria con id ${categorias[i]}`);
            arrayErrores.push( new Error(`No existe la categoria con id ${categorias[i]}.`) );
            continue;
        }

        try {
            const { data: asignacion, error } = await supabase.from('asignacion_producto_categoria')
        .insert({
            id_producto: id_producto,
            id_categoria_producto: categorias[i]
        }).select('*');

        if (error){
            console.log(error);
            throw new Error(`Categoria con id: ${categorias[i]} no fue asignada`);
        }

        if (arrayErrores.length === 0){
            return true;
        }

        return arrayErrores;

        } catch (error) {
            console.log(error);
        }
    }
}

const catProdGet = async (id_producto, supabase) => {
    let arrayIdCategorias = [];

    try {
        const { data: categorias, error } = await supabase
            .from('asignacion_producto_categoria')
            .select('id_categoria_producto')
            .eq('id_producto', id_producto);

        if (error) {
            throw new Error(`Ocurrió un error: ${error.message}`);
        }

        if(categorias.length === 0 || categorias == undefined){
            return [];
        }

        for (const categoria of categorias) {
            arrayIdCategorias.push(categoria.id_categoria_producto);
        }

    } catch (error) {
        console.log(error);
    }

    return arrayIdCategorias; // Retorna el array con los IDs de categorías
}

const deleteCatProd = async (array_categoria_producto, id_producto, supabase) => {
    let arrayErrores = [];
    let exitosas = 0; // Contador de eliminaciones exitosas

    try {
        for (let i = 0; i < array_categoria_producto.length; i++) {
            const { error } = await supabase.from('asignacion_producto_categoria')
                .delete()
                .eq('id_producto', id_producto)
                .eq('id_categoria_producto', array_categoria_producto[i]);

            if (error) {
                arrayErrores.push(`Error al eliminar la relación para id_categoria_producto: ${array_categoria_producto[i]}`);
            } else {
                exitosas++;
            }
        }

        if (arrayErrores.length == 0){
            return true;
        }

        return arrayErrores;

    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: 'Error interno del servidor',
            errors: [error.message] // Puedes capturar el error original aquí
        };
    }
}


module.exports = { catProdAdd, catProdGet, deleteCatProd }