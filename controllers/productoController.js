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
    const { codigo_producto, nombre, descripcion, precio_unitario, precio_mayorista, proveedor, unidad_medida, impuesto, id_usuario  } = req.body;

    try {
        const id_empresa_param = await getEmpresaId(id_usuario, supabase);

        const existencia = await existenciProductCode('producto', 'codigo_producto', codigo_producto, id_empresa_param, supabase);
        if (existencia){
            throw 'Codigo de producto en uso';
        }

        const { data: producto, error } = await supabase.from('producto')
        .update({
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

module.exports = { getProductosOfInventory, postProducto, patchProducto }