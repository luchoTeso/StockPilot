const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// Todas estas rutas caen bajo el prefijo /api/alertas

router.post('/generate', alertController.generateAlerts);
router.get('/', alertController.getActiveAlerts);
router.get('/stats', alertController.getStats);
router.patch('/:id/resolve', alertController.resolveAlert);

module.exports = router;
