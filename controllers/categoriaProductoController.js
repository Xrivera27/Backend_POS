const { getEmpresaId } = require('../db/empresaSvc.js');
const { conteoProdinCat } = require('../db/catProdSvs.js');

const getCategoriaProducto = async (req, res) => {
    const supabase = req.supabase;

    try {
        const { data, error } = await supabase
        .from('categoria_producto')
        .select('*');

        if (error){
            res.status(500).json({ Error: 'Error al obtener categorias' + error.message });
        }

        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ Error: 'Ocurrio un error al obtener categorias' + error.message });
    }
}

const getCategoriaProductoOfEmpresa = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.params.id_usuario;
    const id_empresa = await getEmpresaId(id_usuario, supabase);

    try {
        const { data, error } = await supabase
        .from('categoria_producto')
        .select('id_categoria, nombre_categoria, descripcion')
        .eq('id_empresa', id_empresa)
        .eq('estado', true);

        if (error){
            res.status(500).json({ Error: 'Error al obtener categorias' + error.message });
        }

        const promesas = data.map(async(elemento) =>{
            elemento.totalProd = await conteoProdinCat(elemento.id_categoria, supabase);
        });

        await Promise.all(promesas);

        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ Error: 'Ocurrio un error al obtener categorias' + error.message });
    }
}

const getTotalCatProd = async (req, res) => {
    const supabase = req.supabase;
    const id_categoria_producto = req.params.id_categoria_producto;
    let conteo;
   try {
    conteo = await conteoProdinCat(id_categoria_producto, supabase);

    res.status(200).json({ total: conteo });

   } catch (error) {

    console.log(error);
    res.status(500).json({ error: conteo });

   }
  }

const postCategoria = async (req, res) => {
    const supabase = req.supabase;

    try {
        const { nombre_categoria, descripcion, id_usuario } = req.body;

        const id_empresa = await getEmpresaId(id_usuario, supabase);

        const { data: categorias, error } = await supabase.from('categoria_producto')
        .insert({
            nombre_categoria: nombre_categoria,
            descripcion: descripcion,
            id_empresa: id_empresa
        }).select('*');

        if (error){

            throw error;
        }

        categorias[0].totalProd = 0;

        res.status(200).json(categorias);

    } catch (error) {
        console.log(error);
        throw error;
    }
}

const patchCategoria = async (req, res) => {
    const supabase = req.supabase;

    try {
        const { nombre_categoria, descripcion } = req.body;
        const id_categoria = req.params.id_categoria;

        const { data: categorias, error } = await supabase
            .from('categoria_producto')
            .update({
                nombre_categoria: nombre_categoria,
                descripcion: descripcion
            })
            .eq('id_categoria', id_categoria)
            .select('*');

        // Manejo de errores de la consulta
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // Si no se encuentra ninguna categoría con el id proporcionado
        if (categorias.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        // Enviar las categorías actualizadas
        res.status(200).json(categorias);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor' });
    }
}

const desactivarCategoria = async (req, res) => {
    const supabase = req.supabase;

    try {
        const { estado } = req.body;
        const id_categoria = req.params.id_categoria;

        const { data: categorias, error } = await supabase
            .from('categoria_producto')
            .update({
                estado: estado
            })
            .eq('id_categoria', id_categoria)
            .select('*');

        // Manejo de errores de la consulta
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // Si no se encuentra ninguna categoría con el id proporcionado
        if (categorias.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        // Enviar las categorías actualizadas
        res.status(200).json(categorias);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor' });
    }
}


//para implementar se deberan hacer las revisiones de seguridad primero
const eliminarCategoria = async (req, res) => {
    const supabase = req.supabase;

    try {
        const id_categoria = req.params.id_categoria;
        conteo = await conteoProdinCat(id_categoria, supabase);

        if (conteo > 0){
            throw new Error('Todavia hay productos usando esta categoria!');
        }

        const { data: categorias, error } = await supabase
            .from('categoria_producto')
            .delete()
            .eq('id_categoria', id_categoria)
            .select('*');

        // Manejo de errores de la consulta
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // Si no se encuentra ninguna categoría con el id proporcionado
        if (categorias.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        // Enviar las categorías actualizadas
        res.status(200).json(categorias);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor' });
    }
}

module.exports = {
    getCategoriaProducto, 
    getCategoriaProductoOfEmpresa, 
    postCategoria, 
    patchCategoria, 
    desactivarCategoria, 
    eliminarCategoria,
    getTotalCatProd
}