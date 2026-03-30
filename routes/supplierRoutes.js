const express = require('express');
const router = express.Router();
const suppliersController = require('../controllers/suppliersController');

// Rutas de administración de base de datos
router.get('/api/proveedores', suppliersController.getAll);
router.post('/api/proveedores', suppliersController.create);
router.put('/api/proveedores/:id', suppliersController.update);
router.delete('/api/proveedores/:id', suppliersController.delete);

// Ruta Matemática Pura (FASE 1)
router.get('/api/proveedores/:proveedorId/forecast', suppliersController.getSupplierForecast);

// Ruta IA Copiloto y Riesgo (FASE 3 & 4)
router.post('/api/proveedores/:proveedorId/ai-copilot', suppliersController.generateSmartOrder);

// Ruta Consolidación y Trazabilidad (FASE 5 & 6)
router.post('/api/proveedores/:proveedorId/ordenes', suppliersController.submitSmartOrder);

// Rutas de Historial (Nuevas Brechas)
router.get('/api/ordenes/historial', suppliersController.getOrdersHistory);
router.get('/api/ordenes/:ordenId', suppliersController.getOrderDetail);
router.patch('/api/ordenes/:ordenId/estado', suppliersController.updateOrderStatus);

// Envío de Orden al Proveedor por Email
router.post('/api/ordenes/:ordenId/enviar-proveedor', suppliersController.sendOrderToSupplier);

module.exports = router;

