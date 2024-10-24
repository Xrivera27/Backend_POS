const { getEmpresaId } = require('../db/empresaSvc');

const getempresaupdate = async (req, res) => {
    const supabase = req.supabase;
    try {
        const id_usuario = req.user.id_usuario;
        console.log('ID Usuario:', id_usuario);

        // Obtiene directamente el id_empresa
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        console.log('ID Empresa obtenido:', id_empresa);

        if (!id_empresa) {
            console.error('No se encontró un ID de empresa para el usuario:', id_usuario);
            return res.status(404).json({ message: "Empresa no encontrada para el usuario" });
        }

        // Busca los datos actuales de la empresa con el id_empresa
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

        // Obtener los datos enviados desde el frontend para actualizar
        const { nombre, telefono_principal, correo_principal } = req.body;
        console.log("Datos recibidos del frontend:", req.body); // Depuración

        // Preparar los datos a actualizar
        let updatedData = {
            nombre: nombre || empresa.nombre,
            telefono_principal: telefono_principal || empresa.telefono_principal,
            correo_principal: correo_principal || empresa.correo_principal,
        };

        // Actualizar los datos en la base de datos
        const { data: updatedEmpresa, error: updateError } = await supabase
            .from('Empresas')
            .update(updatedData)
            .eq('id_empresa', id_empresa);

        if (updateError) {
            console.error("Error al realizar la actualización:", updateError);
            return res.status(500).json({ message: 'Error al actualizar la empresa', error: updateError });
        }

        return res.status(200).json({ message: 'Empresa actualizada exitosamente', empresa: updatedEmpresa });

    } catch (error) {
        console.error('Error en el proceso:', error);
        return res.status(500).json({ message: 'Error al obtener o actualizar los datos de la empresa', error: error.message });
    }
};

module.exports = {
    getempresaupdate,
};
