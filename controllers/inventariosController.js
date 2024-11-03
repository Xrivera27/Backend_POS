const { existeInventario, esMismaEmpresa } = require('../db/validaciones.js');

const getInventarioByProducto = async (req, res) => {
    const supabase = req.supabase;
    const { id_producto, id_sucursal } = req.params;

    try {
        const { data: inventario, error } = await supabase.from('inventarios')
        .select('stock_min, stock_max')
        .eq('id_producto', id_producto)
        .eq('id_sucursal', id_sucursal)
        .single();
        
        if ( !inventario){
            res.status(200).json({ stock_min: 0, stock_max: 0  });
            return;
        }

        if (error){
            throw 'Ocurrio un error al buscar stock de inventarios '+ error; 
        }
        
        res.status(200).json(inventario);

    } catch (error) {
        console.error('Error en la API de inventarios:', error);
        res.status(500).json({ message: 'Error interno del servidor. Inténtalo de nuevo más tarde.' });
    }
}
const postOrPatchInventario = async (req, res) => {
    const supabase = req.supabase;
    const { id_producto, id_sucursal } = req.params;
    const { stock_min, stock_max } = req.body;

    try {

        const mismaEmpresa = await esMismaEmpresa(id_producto, id_sucursal, supabase);

        if (!mismaEmpresa){
throw 'Error de seguridad.';
        }

        if (stock_min >= stock_max){
            throw 'Datos invalidos';
        }

        const id_inventario = await existeInventario(id_producto, id_sucursal, supabase);

        if(!id_inventario){
            const response = await postStockMinMax(id_producto, id_sucursal, stock_min, stock_max, supabase);
            res.status(200).json(response);
            return;
        }
        const response = await patchStockMinMax(id_inventario, id_producto, id_sucursal, stock_min, stock_max, supabase);
        res.status(200).json(response);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error en la api'});
    }
}

const postStockMinMax = async (id_producto, id_sucursal, stock_min, stock_max, supabase) => {
    try {
    const updatedFields = {};
    updatedFields.id_producto = id_producto;
    updatedFields.id_sucursal = id_sucursal;
    if (stock_min || stock_min != '' || stock_min !== 0) updatedFields.stock_min = stock_min;
    if (stock_max || stock_max != '' || stock_max !== 0) updatedFields.stock_max = stock_max;

    if (Object.keys(updatedFields).length === 0) {
        throw "No hay campos a actualizar." ;
    }

    const { data: inventario, error } = await supabase.from('inventarios')
    .insert(updatedFields)
    .select('*');

    if(error){
        throw 'Ocurrio un error al insertar fila'
    }
    
    return inventario;


    } catch (error) {
        console.log(error);
        throw error;
    }
}

const patchStockMinMax = async (id_inventario, id_producto, id_sucursal, stock_min, stock_max, supabase) => {
    try {
    const updatedFields = {};
    updatedFields.id_producto = id_producto;
    updatedFields.id_sucursal = id_sucursal;
    if (stock_min || stock_min != '' || stock_min !== 0) updatedFields.stock_min = stock_min;
    if (stock_max || stock_max != '' || stock_max !== 0) updatedFields.stock_max = stock_max;

    if (Object.keys(updatedFields).length === 0) {
        throw "No hay campos a actualizar." ;
    }

    const { data: inventario, error } = await supabase.from('inventarios')
    .update(updatedFields)
    .eq('id_inventario', id_inventario)
    .select('*');

    if(error){
        throw 'Ocurrio un error al insertar fila'
    }
    
    return inventario;


    } catch (error) {
        console.log(error);
        throw error;
    }
} 


module.exports = { getInventarioByProducto, postOrPatchInventario }