const getUsuarioPerfil = async (req, res) => {
    const supabase = req.supabase;

    try {
        const id_usuario = req.user.id_usuario; // Se obtiene del token decodificado

        if (!id_usuario) {
            return res.status(400).json({ error: 'ID de usuario no proporcionado en el token' });
        }

        const { data: usuario, error } = await supabase
            .from('Usuarios')
            .select('nombre_usuario') // Solo seleccionamos el campo necesario
            .eq('id_usuario', id_usuario)
            .single();

        if (error) {
            return res.status(500).json({ error: 'Error al obtener el perfil de usuario: ' + error.message });
        }

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json(usuario); // Devuelve solo el nombre de usuario
    } catch (error) {
        res.status(500).json({ error: 'Error inesperado al obtener el perfil' });
    }
};

module.exports = {
    getUsuarioPerfil,
};
