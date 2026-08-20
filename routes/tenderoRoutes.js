// routes/tenderoRoutes.js
const express = require('express');
const TenderoController = require('../controllers/tenderoController');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/validation');
const router = express.Router();

router.get('/api/tendero', requireLogin, TenderoController.getTenderos);
router.post('/api/tendero', requireLogin, requireAdmin, sanitizeBody, TenderoController.createTendero);
router.put('/api/tendero/:id', requireLogin, requireAdmin, sanitizeBody, TenderoController.updateTendero);
router.delete('/api/tendero/:id', requireLogin, requireAdmin, TenderoController.deleteTendero);

module.exports = router;
