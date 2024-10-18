// Controlador para obtener las categorías
const getCategorias = async (req, res) => {
  const supabase = req.supabase;

  try {
    const { data: categorias, error } = await supabase
      .from('categoria_empresa')
      .select('*'); // Selecciona solo los campos que necesitas

    if (error) {
      return res.status(500).json({ error: 'Error al obtener categorías: ' + error.message });
    }

    res.status(200).json(categorias); // Devuelve las categorías al frontend
  } catch (error) {
    res.status(500).json({ error: 'Error inesperado al obtener categorías' });
    
  }
};

module.exports = {
  getCategorias,
};
