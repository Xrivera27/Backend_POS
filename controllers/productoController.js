const { getEmpresaId } = require('../db/empresaSvc.js');

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

module.exports = { getProductosOfInventory }