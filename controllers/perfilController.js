const getUsuarioPerfil = async (req, res) => {
    const supabase = req.supabase;

    try {
        const id_usuario = req.user.id_usuario; // Se obtiene del token decodificado

        if (!id_usuario) {
            return res.status(400).json({ error: 'ID de usuario no proporcionado en el token' });
        }

        // Primera consulta: Obtener el usuario y su id_rol (usando el nombre correcto de la columna)
        const { data: usuario, error: usuarioError } = await supabase
            .from('Usuarios')
            .select('nombre, apellido, "id_rol"')  // Usa comillas dobles para columnas con caracteres especiales
            .eq('id_usuario', id_usuario)
            .single();

        if (usuarioError) {
            return res.status(500).json({ error: 'Error al obtener el perfil de usuario: ' + usuarioError.message });
        }

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Segunda consulta: Obtener el nombre del rol (cargo) basado en id_rol
        const { data: rol, error: rolError } = await supabase
            .from('Roles')
            .select('cargo')
            .eq('id_rol', usuario["id_rol"])  // Referencia correcta de la columna
            .single();

        if (rolError) {
            return res.status(500).json({ error: 'Error al obtener el rol del usuario: ' + rolError.message });
        }

        res.status(200).json({
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            cargo: rol.cargo  // Aquí devolvemos el nombre del rol
        });
    } catch (error) {
        res.status(500).json({ error: 'Error inesperado al obtener el perfil' });
    }
};

module.exports = {
    getUsuarioPerfil,
};
