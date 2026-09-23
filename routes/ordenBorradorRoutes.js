const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ordenBorradorController');
const { requireLogin, requireAdmin } = require('../middleware/auth');

// Borradores de orden de compra desde el Consejero IA (solo administrador)
router.post('/api/ordenes/borrador/desde-consejero', requireLogin, requireAdmin, ctrl.crearDesdeConsejero);
router.get('/api/ordenes/borradores/resumen', requireLogin, requireAdmin, ctrl.resumen);
router.patch('/api/ordenes/:ordenId/items/:idProducto', requireLogin, requireAdmin, ctrl.editarLinea);
router.delete('/api/ordenes/:ordenId/items/:idProducto', requireLogin, requireAdmin, ctrl.quitarLinea);
router.patch('/api/productos/:id/proveedor', requireLogin, requireAdmin, ctrl.asignarProveedor);

// Un tendero pide un producto al administrador (cualquier usuario con sesión, no solo administrador)
router.post('/api/ordenes/borrador/solicitar', requireLogin, ctrl.solicitarProducto);

module.exports = router;
