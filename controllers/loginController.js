const jwt = require('jsonwebtoken'); // Para generar tokens JWT
const {setCurrentUsername} = require('../services/userLogIn.js');

// Controlador de login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  const supabase = req.supabase; // Obtenemos Supabase desde req

  try {
    // Verifica si el usuario existe en la base de datos
    const { data: user, error } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('nombre_usuario', username)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // Verifica si la contraseña ingresada es correcta (en texto plano)
    if (password !== user.contraseña) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }
    setCurrentUsername(username);

    // Genera un token JWT
    const token = jwt.sign(
      { id_usuario: user.id_usuario, id_rol: user.id_rol }, 
      process.env.JWT_SECRET, // Asegúrate de tener una variable de entorno JWT_SECRET
      { expiresIn: '1h' } // El token expira en 1 hora
    );

    // Envía el token y el rol como respuesta
    return res.json({
      message: 'Login exitoso',
      token,
      role: user.id_rol

    });
  } catch (err) {
    return res.status(500).json({ message: 'Error interno del servidor', error: err.message });
  }
};