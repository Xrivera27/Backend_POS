const getRoles = async (req, res) => {
    const supabase = req.supabase;
    try {
        const { data: roles, error } = await supabase
            .from('Roles')
            .select('*');

        if (error) {
            console.error('Error al obtener roles:', error); // Agregar log del error
            return res.status(500).json({ message: 'Ocurrió un error al obtener la información.' });
        }

        return res.status(200).json(roles);

    } catch (error) {
        console.error('Error inesperado:', error); // Log de errores inesperados
        return res.status(500).json({ message: 'Error interno del servidor.' }); // Retornar mensaje de error
    }
};


module.exports = { getRoles }