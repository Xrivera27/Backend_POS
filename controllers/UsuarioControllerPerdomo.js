// controllers/usuarioController.js
const { supabaseClient: supabase } = require('../supabaseClient');

const getUsuarios = async (req, res) => {
  console.log('Iniciando getUsuarios...');
  try {
    console.log('Ejecutando consulta a Supabase...');
    const { data, error } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('id_rol', 4)
      .eq('estado', true)
      .order('created_at', { ascending: false });

    console.log('Respuesta de Supabase:', { data, error });

    if (error) {
      console.error('Error en getUsuarios:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Datos recuperados exitosamente:', data);
    res.status(200).json(data);
  } catch (err) {
    console.error('Error inesperado en getUsuarios:', err);
    res.status(500).json({ error: err.message });
  }
};

const postUsuario = async (req, res) => {
  console.log('Iniciando postUsuario...');
  console.log('Datos recibidos:', req.body);

  try {
    const { 
      nombre, 
      apellido, 
      nombre_usuario, 
      contraseña, 
      correo, 
      telefono, 
      direccion 
    } = req.body;

    console.log('Ejecutando inserción en Supabase...');
    const { data, error } = await supabase
      .from('Usuarios')
      .insert({
        nombre,
        apellido,
        nombre_usuario,
        contraseña,
        correo,
        telefono,
        direccion,
        id_rol: 4,
        estado: true
      })
      .select();

    if (error) {
      console.error('Error en postUsuario:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Usuario creado exitosamente:', data);
    res.status(200).json(data[0]);
  } catch (err) {
    console.error('Error inesperado en postUsuario:', err);
    res.status(500).json({ error: err.message });
  }
};

const patchUsuario = async (req, res) => {
  console.log('Iniciando patchUsuario...');
  console.log('ID recibido:', req.params.id_usuario);
  console.log('Datos recibidos:', req.body);

  try {
    const id_usuario = req.params.id_usuario;
    const actualizaciones = req.body;

    console.log('Ejecutando actualización en Supabase...');
    const { data, error } = await supabase
      .from('Usuarios')
      .update(actualizaciones)
      .eq('id_usuario', id_usuario)
      .eq('id_rol', 4)
      .select();

    if (error) {
      console.error('Error en patchUsuario:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Usuario actualizado exitosamente:', data);
    res.status(200).json(data[0]);
  } catch (err) {
    console.error('Error inesperado en patchUsuario:', err);
    res.status(500).json({ error: err.message });
  }
};

const desactivarUsuario = async (req, res) => {
  console.log('Iniciando desactivarUsuario...');
  console.log('ID recibido:', req.params.id_usuario);

  try {
    const id_usuario = req.params.id_usuario;
    console.log('Ejecutando desactivación en Supabase...');

    const { data, error } = await supabase
      .from('Usuarios')
      .update({ estado: false })
      .eq('id_usuario', id_usuario)
      .eq('id_rol', 4)
      .select();

    if (error) {
      console.error('Error en desactivarUsuario:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Usuario desactivado exitosamente:', data);
    res.status(200).json({ message: 'Usuario desactivado exitosamente' });
  } catch (err) {
    console.error('Error inesperado en desactivarUsuario:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getUsuarios,
  postUsuario,
  patchUsuario,
  desactivarUsuario
};