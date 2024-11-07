const supabase = require('../supabaseClient'); 

const getClientesPorEmpresa = async (req, res) => {
  const { empresaId } = req.params;
  const id_usuario = req.id_usuario; // Usando id_usuario del middleware

  try {
    const { data, error } = await supabase
      .from('Clientes')
      .select('id_cliente, nombre_completo')
      .eq('id_empresa', empresaId)
      .eq('id_usuario', id_usuario);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

module.exports = { getClientesPorEmpresa };
