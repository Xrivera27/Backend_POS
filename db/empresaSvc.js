const getEmpresaId = async (id_usuario_param, supabase) => {
    try {

        const { data: id_empresa, error } = await supabase.rpc('obtener_id_empresa', { id_usuario_param });

        if(error){
            throw 'Ocurrio un error al obtener empresa';
        }
        return id_empresa;

    } catch (error) {
        throw new Error(error);
    }
}

const empresaUsaSAR = async (id_usuario, supabase) => {
    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        
        const { data: empresa, error } = await supabase.from('Empresas')
        .select('id_empresa, usa_SAR')
        .eq('id_empresa', id_empresa)
        .single();

        if(error){
            console.error('Ocurrio un error', error);
            throw 'Ocurrio un error al buscar sar empresa';
            
        }

        if(empresa.usa_SAR){
            return true;
        }
        return false;

    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = { getEmpresaId, empresaUsaSAR }