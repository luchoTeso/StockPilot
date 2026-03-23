// routes/inventoryRoutes.js
const express = require('express');
const InventoryController = require('../controllers/inventoryController');
const { requireLogin } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/validation');
const router = express.Router();

// Registrar movimientos
router.post('/api/inventario/entrada', requireLogin, sanitizeBody, InventoryController.registerEntry);
router.post('/api/inventario/salida', requireLogin, sanitizeBody, InventoryController.registerExit);
router.post('/api/inventario/ajuste', requireLogin, sanitizeBody, InventoryController.registerAdjustment);

// Consultar movimientos
router.get('/api/inventario/movimientos', requireLogin, InventoryController.getMovements);
router.get('/api/inventario/producto/:id/historial', requireLogin, InventoryController.getProductHistory);
router.get('/api/inventario/resumen', requireLogin, InventoryController.getSummary);
router.get('/api/inventario/productos', requireLogin, InventoryController.getProductList);

module.exports = router;
