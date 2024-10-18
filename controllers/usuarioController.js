const getUsuario = async (req, res) => {
    const supabase = req.supabase;
  
    try {
      const { data: usuario, error } = await supabase
        .from('Usuarios')
        .select('*'); // Selecciona solo los campos que necesitas
  
      if (error) {
        return res.status(500).json({ error: 'Error al obtener Usuarios: ' + error.message });
      }
  
      res.status(200).json(usuario); // Devuelve las categorías al frontend
    } catch (error) {
      res.status(500).json({ error: 'Error inesperado al obtener Usuarios' });
      
    }
  };
  
  module.exports = {
    getUsuario,
  };
  