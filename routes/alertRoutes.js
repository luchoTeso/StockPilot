const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// Todas estas rutas caen bajo el prefijo /api/alertas

router.post('/generate', alertController.generateAlerts);
router.get('/', alertController.getActiveAlerts);
router.get('/stats', alertController.getStats);
router.patch('/:id/resolve', alertController.resolveAlert);

// Ruta para disparo manual del resumen semanal (solo admins)
const { requireLogin } = require('../middleware/auth');
const { runWeeklySummary } = require('../services/schedulerService');
router.post('/test-summary', requireLogin, async (req, res) => {
    try {
        const tiendaId = req.session.tiendaId;
        if (!tiendaId) return res.status(400).json({ error: 'No se encontró la tienda en la sesión' });
        
        const result = await runWeeklySummary(tiendaId);
        res.json({ ok: true, mensaje: `Resumen enviado correctamente (${result.enviados} correos)` });
    } catch (error) {
        console.error('Error en test-summary:', error);
        res.status(500).json({ error: error.message || 'Error al enviar el resumen de prueba' });
    }
});

module.exports = router;
