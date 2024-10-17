const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Obtener el token
  
  if (!token) {
    return res.status(403).json({ message: 'Token no proporcionado' });
  }

  console.log('Token recibido:', token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Guardar el usuario decodificado en la solicitud
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token no válido', error: err.message });
  }
};


module.exports = authMiddleware;
