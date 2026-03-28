/**
 * @file feedbackRoutes.js
 * @description Rutas para el Módulo 14 de Aprendizaje Continuo de IA.
 */

const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Forzar la evaluación de precisión de una orden específica
router.post('/evaluate/:orderId', feedbackController.evaluateOrder);

// Obtener todas las métricas de precisión para el dashboard de Aprendizaje
router.get('/metrics', feedbackController.getGlobalPrecision);

// Obtener órdenes sugeridas para calibración manual
router.get('/orders/evaluable', feedbackController.getEvaluableOrders);

module.exports = router;
