const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');


// Ruta para login
router.get('/',  perfilController.getUserProfile);

module.exports = router;