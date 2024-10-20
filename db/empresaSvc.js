const getEmpresaId = async (id_usuario_param, supabase) => {
    try {

        const { data: id_empresa, error } = await supabase.rpc('obtener_id_empresa', { id_usuario_param });

        if(error){
            throw 'Ocurrio un error al obtener sucursal';
        }
        return id_empresa;

    } catch (error) {
        throw new Error(error);
    }
}

module.exports = { getEmpresaId }