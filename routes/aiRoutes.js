const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { requireLogin } = require('../middleware/auth');

// --- MOTOR ANALÍTICO (MATEMÁTICAS) ---
// Snapshot analítico: Velocidad de Venta y Clasificación Pareto
router.get('/snapshot', requireLogin, aiController.getAnalyticalSnapshot);

// --- MOTOR DE DECISIÓN ESTRATÉGICA (IA) ---
// Recomendaciones de abastecimiento y gestión de riesgos
router.get('/recommendations', requireLogin, aiController.getDashboardRecommendations);

// Sugerencias de promociones y liberación de capital
router.get('/promotions', requireLogin, aiController.getPromotionSuggestions);

// Aplicar estrategia sugerida (Actualización de Inventario)
router.post('/apply-strategy', requireLogin, aiController.applyPromotionStrategy);

// --- AUDITORÍA Y TENDENCIAS ---
// Alertas profesionales (Motor de Decisión Fase 2)
router.get('/alerts', requireLogin, aiController.getProAlerts);

// Tendencia de precios histórica (Gráfica de Variaciones IA)
router.get('/price-trend', requireLogin, aiController.getPriceTrend);

// --- UTILIDADES ---
router.get('/ping', (req, res) => {
  res.json({ pong: true, time: new Date().toISOString() });
});

module.exports = router;
