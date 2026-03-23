// routes/auditRoutes.js
const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { requireLogin } = require('../middleware/auth');

// Solo admin puede acceder a auditoría
const requireAdmin = (req, res, next) => {
  if (req.session.rol !== 'Administrador') {
    return res.status(403).json({ success: false, error: 'Acceso denegado. Solo administradores.' });
  }
  next();
};

router.get('/', requireLogin, requireAdmin, auditController.getLogs);
router.get('/stats', requireLogin, requireAdmin, auditController.getStats);

module.exports = router;
