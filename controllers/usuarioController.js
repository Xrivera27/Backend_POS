const { response } = require('express');
const { getEmpresaId } = require('../db/empresaSvc.js');

const getUsuario = async (req, res) => {
  const supabase = req.supabase;

  try {
    const id_usuario = req.user.id_usuario;

    if (!id_usuario) {
      return res.status(400).json({ error: 'ID de usuario no proporcionado en el token' });
    }

    const { data: usuario, error } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('id_usuario', id_usuario)
      .single(); // Cambia para obtener un único registro

    if (error) {
      return res.status(500).json({ error: 'Error al obtener el usuario: ' + error.message });
    }

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json(usuario); // Devuelve el usuario encontrado al frontend
  } catch (error) {
    res.status(500).json({ error: 'Error inesperado al obtener usuario' });
  }
};

const getUsuarioOfEmpresa = async (req, res) => {
  const supabase = req.supabase;
  const id_usuario = req.params.id_usuario;
  try {
    const response = await getEmpresaId( id_usuario, supabase );
    
    try {
      const { data: usuario, error } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('id_empresa', response);

      if (error) {
        throw new Error('Ocurrió un error en la consulta: ' + error.message);
    }

    // Verificamos si se encontró el usuario
    console.log(usuario);
    res.status(200).json(usuario);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
    

  } catch (error) {

    res.status(500).json(error);
  }
}

module.exports = {
  getUsuario, getUsuarioOfEmpresa
};
