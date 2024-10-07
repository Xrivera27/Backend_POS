const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

// Ruta para login
router.post('/', loginController.login);

module.exports = router;
