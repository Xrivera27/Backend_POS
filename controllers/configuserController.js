const updateUsuario = async (req, res) => {
  const supabase = req.supabase;

  try {
    const id_usuario = req.user.id_usuario;

    if (!id_usuario) {
      return res.status(400).json({ error: 'ID de usuario no proporcionado en el token' });
    }

    // Verificar si el usuario existe
    const { data: existingUser, error: userError } = await supabase
      .from('Usuarios')
      .select('contraseña')
      .eq('id_usuario', id_usuario)
      .single();

    if (userError || !existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Obtener los datos enviados desde el frontend
    const { 
      nombre_usuario, 
      telefono, 
      direccion, 
      contraseña, 
      contraseña_nueva, 
      contraseña_confirm, 
      nombre, 
      apellido, 
      correo 
    } = req.body;

    console.log("Datos recibidos del frontend:", req.body); // Para depuración

    // Verificar que la contraseña actual coincida con la almacenada
    if (contraseña && contraseña !== existingUser.contraseña) {
      return res.status(400).json({ message: 'La contraseña actual no es correcta.' });
    }

    // Preparar los datos a actualizar
    let updatedData = {
      nombre_usuario,
      telefono,
      direccion,
      nombre,
      apellido,
      correo,
    };

    // Si se proporciona una nueva contraseña, verificamos y la añadimos
    if (contraseña_nueva) {
      // Usar trim() para eliminar espacios en blanco
      if (!contraseña_confirm || contraseña_nueva.trim() !== contraseña_confirm.trim()) {
        return res.status(400).json({ message: 'Las contraseñas nuevas no coinciden.' });
      }
      updatedData.contraseña = contraseña_nueva.trim(); // Añadir nueva contraseña, recortada
    }

   

    // Actualizar los datos del usuario en la base de datos
    const { data, error } = await supabase
      .from('Usuarios')
      .update(updatedData)
      .eq('id_usuario', id_usuario);

    if (error) {
      console.error("Error al realizar la actualización:", error);
      return res.status(500).json({ message: 'Error al actualizar el usuario', error });
    }

    return res.status(200).json({ message: 'Usuario actualizado exitosamente', data });
  } catch (error) {
    console.error('Error al actualizar los datos del usuario:', error);
    return res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
};

module.exports = {
  updateUsuario,
};
