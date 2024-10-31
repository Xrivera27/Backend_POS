const express = require('express');
const router = express.Router();
const { getClientes, getClientesByUsuario, postCliente, patchCliente, deleteCliente, desactivarCliente } = require('../controllers/clientesController');

router.get('/', getClientes); // Obtener todos los clientes
router.get('/:id_usuario', getClientesByUsuario); // Clientes por usuario
router.post('/crear-cliente/:id_usuario', postCliente); // Crear cliente
router.patch('/actualizar-cliente/:id_cliente', patchCliente);
router.patch('/desactivar-cliente/:id_cliente', desactivarCliente); // Actualizar cliente
router.delete('/eliminar-cliente/:id_cliente', deleteCliente); // Eliminar cliente

module.exports = router;
