const insertarRelacion = async (id_empresa, id_cliente, supabase) => {
    try {
        const { data, error } = await supabase
            .from('empresas_clientes')
            .insert({
                id_empresa: id_empresa,
                id_cliente: id_cliente,
            })
            .select('*');

        if (error) {
            return 'Ocurrió un error al crear la relación empresa-cliente';
        }
        
        return true;
    } catch (error) {
        throw error;
    }
}

const existeRelacion = async (id_empresa, id_cliente, supabase) => {
    try {
        const { data, error } = await supabase
            .from('Empresa_Cliente')
            .select('*')
            .eq('id_empresa', id_empresa)
            .eq('id_cliente', id_cliente);

        if (error) {
            throw error;  // Asegúrate de que esto se maneje apropiadamente en `patchCliente`
        }

        return data && data.length > 0; // Devuelve `true` si la relación existe
    } catch (error) {
        return false; // O maneja el error de otra forma si prefieres retornar el objeto de error
    }
};


module.exports = { insertarRelacion, existeRelacion };
