const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const clienteController = require('../controllers/clienteController');

// Todas las rutas requieren estar autenticado
router.use(requireLogin);

router.post('/clientes', clienteController.createCliente);
router.get('/clientes', clienteController.getClientes);
router.get('/clientes/:id', clienteController.getClienteDetalle);
router.post('/clientes/:id_cliente/abonos', clienteController.registrarAbono);

module.exports = router;
