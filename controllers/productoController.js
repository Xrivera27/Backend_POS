const { getEmpresaId } = require('../db/empresaSvc.js');
const { existenciProductCode } = require('../db/validaciones.js');

const getProductosOfInventory = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.params.id_usuario;

    try {
        const id_empresa_param = await getEmpresaId(id_usuario, supabase);

        const {data: productos, error} = await supabase.rpc('view_inventory_sucursal', {id_empresa_param})
        .select('*');

        if (error){
            throw 'Ocurrio un error al obtener productos.'
        }

        res.status(200).json(productos);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
}

const postProducto = async (req, res) => {
    const supabase = req.supabase;
    const { codigo_producto, nombre, descripcion, precio_unitario, precio_mayorista, proveedor, unidad_medida, impuesto, id_usuario  } = req.body;

    try {
        const id_empresa_param = await getEmpresaId(id_usuario, supabase);

        const existencia = await existenciProductCode('producto', 'codigo_producto', codigo_producto, id_empresa_param, supabase);
        if (existencia){
            throw 'Codigo de producto en uso';
        }

        const { data: producto, error } = await supabase.from('producto')
        .insert({
            nombre: nombre,
            id_unidad_medida: unidad_medida,
            impuesto: impuesto,
            id_proveedor: proveedor,
            descripcion: descripcion,
            id_empresa: id_empresa_param,
            precio_unitario: precio_unitario,
            precio_mayorista: precio_mayorista,
            codigo_producto: codigo_producto
        }).select('*');

        if(error){
            throw 'Ocurrio un error al guardar producto';
        }

        producto[0].stock_actual = 0;

        res.status(200).json(producto);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }

}

const patchProducto = async (req, res) => {
    const supabase = req.supabase;
    const { codigo_producto, nombre, descripcion, precio_unitario, precio_mayorista, proveedor, unidad_medida, impuesto, id_usuario } = req.body;
    const id_producto = req.params.id_producto;

    // Crear un objeto de actualización solo con los campos proporcionados

    const id_empresa_param = await getEmpresaId(id_usuario, supabase); 
    const updatedFields = {};
    if (nombre) updatedFields.nombre = nombre;
    if (unidad_medida) updatedFields.id_unidad_medida = unidad_medida;
    if (impuesto !== undefined || impuesto != 0) updatedFields.impuesto = impuesto;
    if (proveedor) updatedFields.id_proveedor = proveedor;
    if (descripcion) updatedFields.descripcion = descripcion;
    if (precio_unitario !== undefined) updatedFields.precio_unitario = precio_unitario;
    if (precio_mayorista !== undefined) updatedFields.precio_mayorista = precio_mayorista;
    if (codigo_producto) updatedFields.codigo_producto = codigo_producto;// Asegúrate de tener este dato

    // Evitar operación si no hay campos actualizables
    if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({ message: "No hay campos a actualizar." });
    }

    try {
        // Verificar si el código de producto ya está en uso, si ha sido proporcionado
        if (codigo_producto) {
            const existencia = await existenciProductCode('producto', 'codigo_producto', codigo_producto, id_empresa_param, supabase);
            if (existencia) {
                return res.status(400).json({ message: "El código de producto ya está en uso." });
            }
        }

        // Realizar actualización en Supabase solo con los campos modificados
        const { data: producto, error } = await supabase.from('producto')
            .update(updatedFields)
            .eq('id_producto', id_producto)
            .select('*');

        if (error) {
            throw new Error(`Error al actualizar producto: ${error.message}`);
        }

        res.status(200).json(producto);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar producto", error: error.message });
    }
}


module.exports = { getProductosOfInventory, postProducto, patchProducto }