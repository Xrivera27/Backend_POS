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

module.exports = {getCategoriaProducto}