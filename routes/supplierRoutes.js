const express = require('express');
const router = express.Router();
const suppliersController = require('../controllers/suppliersController');
const { requireLogin } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/validation');

// --- ADMINISTRACIÓN DE PROVEEDORES (CRUD) ---
router.get('/api/proveedores', requireLogin, suppliersController.getAll);
router.post('/api/proveedores', requireLogin, sanitizeBody, suppliersController.create);
router.put('/api/proveedores/:id', requireLogin, sanitizeBody, suppliersController.update);
router.delete('/api/proveedores/:id', requireLogin, suppliersController.delete);

// --- COMPRAS INTELIGENTES (CO-PILOTO IA) ---
// FASE 1: Forecast Matemático
router.get('/api/proveedores/:proveedorId/forecast', requireLogin, suppliersController.getSupplierForecast);

// FASE 3 & 4: Consulta IA Copiloto
router.post('/api/proveedores/:proveedorId/ai-copilot', requireLogin, suppliersController.generateSmartOrder);

// FASE 5 & 6: Registro de Orden y Trazabilidad
router.post('/api/proveedores/:proveedorId/ordenes', requireLogin, suppliersController.submitSmartOrder);

// --- HISTORIAL Y CUENTAS POR PAGAR (FINANZAS) ---
router.get('/api/ordenes/historial', requireLogin, suppliersController.getOrdersHistory);
router.get('/api/ordenes/:ordenId', requireLogin, suppliersController.getOrderDetail);
router.patch('/api/ordenes/:ordenId/estado', requireLogin, suppliersController.updateOrderStatus);

// Registro de Pagos (Abonos)
router.post('/api/proveedores/ordenes/:ordenId/pay', requireLogin, suppliersController.registerPayment);

// Envío de Orden por Email
router.post('/api/ordenes/:ordenId/enviar-proveedor', requireLogin, suppliersController.sendOrderToSupplier);

module.exports = router;
