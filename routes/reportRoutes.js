// routes/reportRoutes.js
const express = require('express');
const ReportController = require('../controllers/reportController');
const { requireLogin } = require('../middleware/auth');
const { sanitizeBody, validateReport } = require('../middleware/validation');
const router = express.Router();

router.get('/api/reportes', requireLogin, ReportController.getReports);
router.get('/api/reportes/download/:id', requireLogin, ReportController.downloadReport);
router.post('/api/reportes', requireLogin, sanitizeBody, validateReport, ReportController.createReport);
router.put('/api/reportes/:id', requireLogin, sanitizeBody, validateReport, ReportController.updateReport);
router.delete('/api/reportes/:id', requireLogin, ReportController.deleteReport);

module.exports = router;