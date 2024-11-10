const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Obtener el token

  if (!token) {
    return res.status(403).json({ message: 'Token no proporcionado' });
  }

  try {
    console.log('Token recibido:', token); // Verifica el token recibido
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decodificar el token con la clave secreta
   // console.log('Datos decodificados del token:', decoded); // Verificar datos decodificados
    req.user = decoded; // Guardar el usuario decodificado en req.user
    next();
  } catch (err) {
    console.error('Error al verificar el token:', err.message);
    return res.status(401).json({ message: 'Token no válido', error: err.message });
  }
};

module.exports = authMiddleware;
