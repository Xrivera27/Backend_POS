const insertarRelacion = async (id_empresa, id_proveedor, supabase) => {

    try {
        const { data, error} = await supabase.from('empresas_proveedores')
        .insert({
            id_empresa: id_empresa,
            id_proveedor: id_proveedor,
        }).select('*');

        if (error)
        {
            return 'Ocurrio un error en la creacion de la relacion empresa-proveedor';
        }
            return true;
      

    } catch (error) {
        
        throw error;
    }
}

const existeRelacion = async (id_empresa, id_proveedor, supabase) => {
try {
    const { data, error } = await supabase
    .from('empresas_proveedores')
    .select('*')
    .eq('id_proveedor', id_proveedor)
    .eq('id_empresa', id_empresa);

    if (error){
        throw new Error(`Ocurrio un error al verificar la relacion empresa proveedor : ${error}`);
    }
   
    if (data.length === 0 ){
        return false;
    }
        return true;
    
} catch (error) {
    throw error;
}   
}

const deleteRelacion = async (id, supabase) => {
    try {
        const {data, error} = await supabase.from('empresas_proveedores').delete().eq('id', id);
        
        if(error){

            throw error;
        }
        return true;

    } catch (error) {
        throw new Error('Fallo del servidor');
    }
}

module.exports = { insertarRelacion, deleteRelacion, existeRelacion }