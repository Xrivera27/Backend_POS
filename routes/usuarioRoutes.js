const express = require('express');
const router = express.Router();

const { getUsuario, getRolUsuario, getUsuarioOfEmpresa, getUsuarioOfSucursal, postUsuario, patchUsuario, desactivarUsuario, validarUsuario } = require('../controllers/usuarioController');
const authMiddleware = require('../middlewares/loginMiddleware');

// Ruta para obtener información del usuario logueado (requiere token)
router.get('/', authMiddleware, getUsuario); // Cambia '/' por '/usuarios'
router.get('/getBy-empresa/:id_usuario', getUsuarioOfEmpresa);
router.get('/getBy-sucursal/:id_usuario/:id_sucursal', getUsuarioOfSucursal);
router.get('/get-rol/:id_usuario', getRolUsuario);
router.post('/crear', postUsuario);
router.patch('/actualizar/:id_usuario', patchUsuario);
router.patch('/desactivar/:id_usuario', desactivarUsuario);


router.post('/validar', validarUsuario); // Para nuevo usuario
router.post('/validar/:id_usuario', validarUsuario); // Para edición

module.exports = router;
