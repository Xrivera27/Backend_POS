const jwt = require('jsonwebtoken');


app.use((req, res, next) => {
  console.log('Cuerpo de la solicitud:', req.body);
  next();
});


// Middleware para verificar JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Obtiene el token después de "Bearer"
  
  if (!token) {
    return res.status(403).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Guarda la información decodificada en la solicitud
    next(); // Llama al siguiente middleware o ruta
  } catch (err) {
    return res.status(401).json({ message: 'Token no válido', error: err.message });
  }
};

module.exports = authMiddleware;
