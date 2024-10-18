// perfilController.js

const supabase = require('../supabaseClient'); // Asegúrate de tener tu cliente de Supabase configurado

exports.getUserProfile = async (req, res) => {
    try {
        const id_usuario = req.user.id; // Supongamos que tienes el ID del usuario en req.user

        // Busca al usuario en la base de datos
        const { data: user, error } = await supabase
            .from('Usuarios')
            .select('nombre')
            .eq('id_usuario', id_usuario)
            .single(); // Solo debe haber un usuario

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Enviar los datos de perfil (en este caso, el nombre de usuario)
        res.json({ username: user.nombre });
    } catch (error) {
        console.error('Error en getUserProfile:', error); // Para ayudar a depurar
        res.status(500).json({ error: 'Error al obtener el perfil del usuario' });
    }
};

