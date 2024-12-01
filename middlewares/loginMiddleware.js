const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('Middleware de autenticación iniciado');
  const authHeader = req.headers['authorization'];
  console.log('Header de autorización:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('No se proporcionó token');
    return res.status(403).json({ message: 'Token no proporcionado' });
  }

  try {
    console.log('Intentando verificar token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verificado exitosamente:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Error en verificación de token:', {
      message: err.message,
      type: err.name,
      token: token.substring(0, 10) + '...' // Solo mostrar parte del token por seguridad
    });
    return res.status(401).json({ message: 'Token no válido', error: err.message });
  }
};

module.exports = authMiddleware;
