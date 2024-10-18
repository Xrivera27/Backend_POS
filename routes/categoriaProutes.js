const express = require('express');
const router = express.Router();

const { getCategoriaProducto } = require('../controllers/categoriaProductoController.js');

router.get('/', getCategoriaProducto);

module.exports = router;