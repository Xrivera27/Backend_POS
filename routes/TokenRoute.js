const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/loginMiddleware');

// Ruta para verificar el token
router.get('/verify-token', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;