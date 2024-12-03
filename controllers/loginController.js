const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const supabase = req.supabase;

  try {
    // Verifica si el usuario existe en la base de datos
    const { data: user, error } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('nombre_usuario', username)
      .single();

    // Manejo de error si el usuario no se encuentra
    if (error || !user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // Verifica el estado del usuario
    if (!user.estado) {
      return res.status(403).json({ message: 'Usuario inhabilitado' });
    }

    // Verifica si la contraseña ingresada es correcta (en texto plano)
    if (password !== user.contraseña) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Genera un token JWT
    const token = jwt.sign(
      { 
        id_usuario: user.id_usuario, 
        id_rol: user.id_rol, 
        username: user.nombre_usuario 
      }, 
      process.env.JWT_SECRET,
    );

    // Envía el token y el rol como respuesta
    return res.json({
      message: 'Login exitoso',
      token,
      role: user.id_rol
    });
  } catch (err) {
    // Manejo de errores del servidor
    return res.status(500).json({ 
      message: 'Error interno del servidor', 
      error: err.message 
    });
  }
};