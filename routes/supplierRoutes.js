const express = require('express');
const router = express.Router();
const suppliersController = require('../controllers/suppliersController');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/validation');

// --- ADMINISTRACIÓN DE PROVEEDORES (CRUD) ---
router.get('/api/proveedores', requireLogin, suppliersController.getAll);
router.post('/api/proveedores', requireLogin, requireAdmin, sanitizeBody, suppliersController.create);
router.put('/api/proveedores/:id', requireLogin, requireAdmin, sanitizeBody, suppliersController.update);
router.delete('/api/proveedores/:id', requireLogin, requireAdmin, suppliersController.delete);

// --- COMPRAS INTELIGENTES (CO-PILOTO IA) ---
// FASE 1: Forecast Matemático
router.get('/api/proveedores/:proveedorId/forecast', requireLogin, requireAdmin, suppliersController.getSupplierForecast);

// FASE 3 & 4: Consulta IA Copiloto
router.post('/api/proveedores/:proveedorId/ai-copilot', requireLogin, requireAdmin, suppliersController.generateSmartOrder);

// FASE 5 & 6: Registro de Orden y Trazabilidad
router.post('/api/proveedores/:proveedorId/ordenes', requireLogin, requireAdmin, suppliersController.submitSmartOrder);

// --- HISTORIAL Y CUENTAS POR PAGAR (FINANZAS) ---
router.get('/api/ordenes/historial', requireLogin, requireAdmin, suppliersController.getOrdersHistory);
router.get('/api/ordenes/:ordenId', requireLogin, requireAdmin, suppliersController.getOrderDetail);
router.patch('/api/ordenes/:ordenId/estado', requireLogin, requireAdmin, suppliersController.updateOrderStatus);

// Recepción de mercancía: cierra la orden y suma el stock recibido (Fase E del plan 13)
router.post('/api/ordenes/:ordenId/completar', requireLogin, requireAdmin, suppliersController.completarRecepcion);

// Registro de Pagos (Abonos)
router.post('/api/proveedores/ordenes/:ordenId/pay', requireLogin, requireAdmin, suppliersController.registerPayment);

// Envío de Orden por Email
router.post('/api/ordenes/:ordenId/enviar-proveedor', requireLogin, requireAdmin, suppliersController.sendOrderToSupplier);

// PDF de la orden (proveedor sin correo: se envía por fuera de la app y se marca "Enviada" a mano)
router.get('/api/ordenes/:ordenId/pdf', requireLogin, requireAdmin, suppliersController.downloadOrderPdf);

module.exports = router;
