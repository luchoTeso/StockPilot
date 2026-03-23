// routes/saleRoutes.js
const express = require('express');
const SaleController = require('../controllers/saleController');
const { requireLogin } = require('../middleware/auth');
const { sanitizeBody, validateSale } = require('../middleware/validation');
const router = express.Router();

router.get('/api/ventas', requireLogin, SaleController.getSales);
router.get('/api/ventas/stats', requireLogin, SaleController.getSalesStats);
router.post('/api/registrar-venta', requireLogin, sanitizeBody, validateSale, SaleController.registerSale);

module.exports = router;