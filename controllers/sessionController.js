const { getCurrentUsername } = require('../services/userLogIn.js');

const getSesion = async (req, res) => {
    const supabase = req.supabase;
    const username = getCurrentUsername();

    try {
      const { data: usuario, error } = await supabase
        .from('Usuarios')
        .select('*')
        .eq('nombre_usuario', `${username}`);// Selecciona solo los campos que necesitas
  
      if (error) {
        return res.status(500).json({ error: 'Error al obtener Usuarios: ' + error.message }); g6
      }
  
      res.status(200).json(usuario); // Devuelve las categorías al frontend
    } catch (error) {
      res.status(500).json({ error: 'Error inesperado al obtener Usuarios' });
      
    }
  };

module.exports = { getSesion }
