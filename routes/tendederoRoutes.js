// routes/tendederoRoutes.js
const express = require('express');
const TendederoController = require('../controllers/tendederoController');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/validation');
const router = express.Router();

router.get('/api/tendedero', requireLogin, TendederoController.getTendederos);
router.post('/api/tendedero', requireLogin, requireAdmin, sanitizeBody, TendederoController.createTendedero);
router.put('/api/tendedero/:id', requireLogin, requireAdmin, sanitizeBody, TendederoController.updateTendedero);
router.delete('/api/tendedero/:id', requireLogin, requireAdmin, TendederoController.deleteTendedero);

module.exports = router;