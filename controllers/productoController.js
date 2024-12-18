const { getEmpresaId } = require('../db/empresaSvc.js');
const { existenciProductCode } = require('../db/validaciones.js');
const { catProdAdd, catProdGet, deleteCatProd } = require('../db/catProdSvs.js');
const { pruebaPromos } = require('../db/promocionesSvs.js');
const { postInventarioEmpresas } = require('../db/inventarioSvc.js');

const getProductosOfInventory = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.params.id_usuario;

    try {
        const id_empresa_param = await getEmpresaId(id_usuario, supabase);

        const {data: productos, error} = await supabase.rpc('view_inventory_sucursal', {id_empresa_param})
        .select('*');

        const promesaPromos = productos.map(async p => {
            const { resultado, promos } = await pruebaPromos(p.id_producto, supabase);
            if(resultado ){

                p.promocion = promos.promocion_nombre || promos.nombre 
            }
            else {
                p.promocion = 'Sin promoción';
            }

        });

        await Promise.all(promesaPromos);

        if (error){
            throw 'Ocurrio un error al obtener productos.' + error;
        }

        res.status(200).json(productos);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
}

const getProductosOfInventorySucursal = async (req, res) => {
    const supabase = req.supabase;
    const id_sucursal_param = req.params.id_sucursal;

    try {

        const {data: productos, error} = await supabase.rpc('view_inventory_only_sucursal', {id_sucursal_param})
        .select('*');

        const promesaPromos = productos.map(async p => {
            const { resultado, promos } = await pruebaPromos(p.id_producto, supabase);
            if(resultado){
     
                p.promocion = promos.promocion_nombre || promos.nombre 
            }
            else {
                p.promocion = 'Sin promoción';
            }
        });

        await Promise.all(promesaPromos);

        if (error){
            throw 'Ocurrio un error al obtener productos.'
        }

        res.status(200).json(productos);

    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
}

const getExtraInfoProduct = async (req, res) => {
    const supabase = req.supabase;
    const id_producto  = req.params.id_producto;

    try {
        const arrayIdCategorias = await catProdGet(id_producto, supabase);

        const { data: info, error } = await supabase.from('producto')
        .select('cantidad_activar_mayorista, precio_mayorista, impuesto, id_unidad_medida, id_proveedor')
        .eq('id_producto', id_producto);

        if (!info || info.length === 0) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        if (error){
            throw 'Ocurrio un error al ejecutar consulta';
        }

        info[0].categorias = arrayIdCategorias;

        res.status(200).json(info[0]);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error al obtener info de producto", error: error.message });
    }

}

const postProducto = async (req, res) => {
    const supabase = req.supabase;
    const { codigo_producto, 
            nombre, 
            descripcion, 
            precio_unitario, 
            precio_mayorista, 
            proveedor, 
            unidad_medida, 
            impuesto, 
            id_usuario,
           cantidad_activar_mayorista,
            categorias  
        } = req.body;

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
            cantidad_activar_mayorista:cantidad_activar_mayorista,
            codigo_producto: codigo_producto
        }).select('*');

        if(error){
            throw 'Ocurrio un error al guardar producto';
        }

        await postInventarioEmpresas(producto[0].id_producto, id_empresa_param, supabase);


        if (categorias && Array.isArray(categorias) && categorias.length > 0){
            const asignarCat =  await catProdAdd(categorias, producto[0].id_producto, supabase);

            if (asignarCat != true){
             console.log(asignarCat);
            }
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
    const { 
        codigo_producto, 
        nombre, 
        descripcion, 
        precio_unitario, 
        precio_mayorista,
       cantidad_activar_mayorista,
        proveedor, 
        unidad_medida, 
        impuesto, 
        id_usuario,
        categorias
    } = req.body;
    const id_producto = req.params.id_producto;

    const updatedFields = {};
    if (nombre || nombre != '') updatedFields.nombre = nombre;
    if (unidad_medida || unidad_medida !== '') updatedFields.id_unidad_medida = unidad_medida;
    if (impuesto !== undefined || impuesto != 0) updatedFields.impuesto = impuesto;
    if (proveedor) updatedFields.id_proveedor = proveedor;
    if (descripcion || descripcion !== '') updatedFields.descripcion = descripcion;
    if (precio_unitario !== undefined) updatedFields.precio_unitario = precio_unitario;
    if (precio_mayorista !== undefined) updatedFields.precio_mayorista = precio_mayorista;
    if (cantidad_activar_mayorista !== undefined) updatedFields.cantidad_activar_mayorista =cantidad_activar_mayorista;
    if (codigo_producto || codigo_producto !== '') updatedFields.codigo_producto = codigo_producto;// Asegúrate de tener este dato

    // Evitar operación si no hay campos actualizables
    if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({ message: "No hay campos a actualizar." });
    }

    try {
        const id_empresa_param = await getEmpresaId(id_usuario, supabase); 

        // Verificar si el código de producto ya está en uso, si ha sido proporcionado
        if (codigo_producto) {
            const existencia = await existenciProductCode('producto', 'codigo_producto', codigo_producto, id_empresa_param, supabase);
            if (existencia) {
                return res.status(400).json({ message: "El código de producto ya está en uso." });
            }
        }

        const { data: producto, error } = await supabase.from('producto')
            .update(updatedFields)
            .eq('id_producto', id_producto)
            .select('*');

        if (error) {
            throw new Error(`Error al actualizar producto: ${error.message}`);
        }

        if ( categorias !== undefined){

            let preCat = await catProdGet(id_producto, supabase);

            const arrayEliminar = preCat.filter(elemento => !categorias.includes(elemento));
            const arrayAgregar = categorias.filter(elemento => !preCat.includes(elemento));

            const asignarCat =  await catProdAdd(arrayAgregar, id_producto, supabase);
            const eliminarCat = await deleteCatProd(arrayEliminar, id_producto, supabase );
    
            if ( asignarCat === true && eliminarCat === true){
                console.log('Relaciones actualizadas');
            }
        }

      

        res.status(200).json(producto);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar producto", error: error.message });
    }
}

const desactivarProducto = async (req, res) => {
    const supabase = req.supabase;
    const id_producto = req.params.id_producto;
    const { estado } = req.body;

    try {
        const {data, error } = await supabase.from('producto')
        .update({
            estado: estado,
            id_unidad_medida: null
        }).eq('id_producto', id_producto);

        if (error){
            console.log(error);
            throw 'Error al eliminar producto';
        }

        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ message: "Error al desactivar producto", error: error.message });
    }
}


module.exports = { getProductosOfInventory, getProductosOfInventorySucursal, postProducto, patchProducto, desactivarProducto, getExtraInfoProduct }