// loginMiddleware.js
const jwt = require('jsonwebtoken');

const ClienteMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.id_usuario = decoded.id_usuario; // Aquí pasamos id_usuario al req
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token no válido', error: err.message });
  }
};

module.exports = ClienteMiddleware;
