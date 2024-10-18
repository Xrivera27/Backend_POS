const express = require('express');
const router = express.Router();
const { getSesion } = require('../controllers/sessionController.js');


router.get('/', getSesion);

module.exports = router;