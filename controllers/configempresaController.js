const { getEmpresaId } = require('../db/empresaSvc');

const getEmpresaInfo = async (req, res) => {
    const supabase = req.supabase;
    try {
        const id_usuario = req.user.id_usuario;
       

        // Obtiene directamente el id_empresa
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        

        if (!id_empresa) {
            console.error('No se encontró un ID de empresa para el usuario:', id_usuario);
            return res.status(404).json({ message: "Empresa no encontrada para el usuario" });
        }

        // Busca los datos de la empresa con el id_empresa obtenido
        const { data: empresa, error: empresaError } = await supabase
            .from('Empresas')
            .select('*')
            .eq('id_empresa', id_empresa)
            .single();

        if (empresaError) {
            console.error('Error al consultar la base de datos:', empresaError);
            return res.status(500).json({ message: 'Error al consultar la base de datos', error: empresaError });
        }

        if (!empresa) {
            console.error('No se encontraron datos para la empresa con ID:', id_empresa);
            return res.status(404).json({ message: "Datos de la empresa no encontrados" });
        }

        return res.status(200).json({ empresa });

    } catch (error) {
        console.error('Error en el proceso:', error);
        return res.status(500).json({ message: 'Error al obtener los datos de la empresa', error: error.message });
    }
};

module.exports = {
    getEmpresaInfo,
};
