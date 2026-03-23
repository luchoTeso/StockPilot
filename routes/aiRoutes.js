const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { requireLogin } = require('../middleware/auth');

// Endpoint para obtener el snapshot analítico (Matemáticas de Velocity/Pareto)
router.get('/snapshot', requireLogin, aiController.getAnalyticalSnapshot);

// Endpoint principal: Recomendaciones estratégicas de IA
router.get('/recommendations', requireLogin, aiController.getDashboardRecommendations);

// Alertas profesionales (Motor de Decisión Fase 2)
router.get('/alerts', requireLogin, aiController.getProAlerts);

router.get('/ping', (req, res) => {
  res.json({ pong: true, time: new Date().toISOString() });
});

module.exports = router;
