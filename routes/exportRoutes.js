// routes/exportRoutes.js
const express = require('express');
const ExportController = require('../controllers/exportController');
const { requireLogin } = require('../middleware/auth');
const router = express.Router();

// Exportar ventas a CSV (guarda en exports/)
router.post('/api/exportar/ventas', requireLogin, ExportController.exportSales);

// Exportar reportes a CSV (guarda en exports/)
router.post('/api/exportar/reportes', requireLogin, ExportController.exportReports);

// Listar archivos exportados
router.get('/api/exportar/archivos', requireLogin, ExportController.listExports);

// Descargar un archivo exportado
router.get('/api/exportar/descargar/:filename', requireLogin, ExportController.downloadExport);

module.exports = router;
