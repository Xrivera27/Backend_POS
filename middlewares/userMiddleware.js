const jwt = require('jsonwebtoken');

// Middleware para verificar el token de autenticación
module.exports = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Obtener el token del header
  
  if (!token) return res.sendStatus(403); // No hay token

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;  // Adjunta el usuario decodificado al request
    next();
  });
};
