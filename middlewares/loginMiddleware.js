const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Obtener el token
  
  if (!token) {
    return res.status(403).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decodificar el token con la clave secreta
    console.log('Datos decodificados del token:', decoded); // <-- Agrega esto para ver qué contiene el token
    req.user = decoded; // Guardar el usuario decodificado en req.user
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token no válido', error: err.message });
  }
};

module.exports = authMiddleware;
