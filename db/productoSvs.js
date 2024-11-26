const getEmpresaIdbyProduct = async (id_producto, supabase) => {
    try {
        const { data: producto, error } = await supabase.from('producto')
        .select('id_producto, id_empresa')
        .eq('id_producto', id_producto)
        .eq('estado', true);

        if(!producto || producto.length === 0){
            return {
                resultado: false
            }
        }

        if(error){
            throw error;
        }

        return {
            id_empresa: producto[0].id_empresa,
            resultado: true
        }

    } catch (error) {
        console.error('Ocurrio un error: ', error);
        return {
            resultado: false
        }
    }
}

module.exports = { getEmpresaIdbyProduct }