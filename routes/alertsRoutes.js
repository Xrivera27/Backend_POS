const express = require('express');
const router = express.Router();
const { getAlertas } = require('../controllers/alertsController.js');

router.get('/get-alertas/:id_usuario', getAlertas);

module.exports = router;