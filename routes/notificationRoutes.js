const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { requireLogin } = require('../middleware/auth');

// GET /api/notificaciones — Notificaciones no leídas del usuario
router.get('/', requireLogin, async (req, res) => {
    try {
        const userId = req.session.userId;
        const limit = parseInt(req.query.limit, 10) || 10;
        const notifications = await Notification.getUnread(userId, limit);
        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Error obteniendo notificaciones:', error);
        res.status(500).json({ success: false, error: 'Error al obtener notificaciones.' });
    }
});

// GET /api/notificaciones/count — Conteo de no leídas
router.get('/count', requireLogin, async (req, res) => {
    try {
        const userId = req.session.userId;
        const count = await Notification.countUnread(userId);
        res.json({ success: true, count });
    } catch (error) {
        console.error('Error contando notificaciones:', error);
        res.status(500).json({ success: false, error: 'Error al contar notificaciones.' });
    }
});

// PATCH /api/notificaciones/:id/read — Marcar una como leída
router.patch('/:id/read', requireLogin, async (req, res) => {
    try {
        const userId = req.session.userId;
        await Notification.markAsRead(req.params.id, userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error marcando notificación como leída:', error);
        res.status(500).json({ success: false, error: 'Error al marcar como leída.' });
    }
});

// PATCH /api/notificaciones/read-all — Marcar todas como leídas
router.patch('/read-all', requireLogin, async (req, res) => {
    try {
        const userId = req.session.userId;
        await Notification.markAllAsRead(userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error marcando todas como leídas:', error);
        res.status(500).json({ success: false, error: 'Error al marcar todas como leídas.' });
    }
});

module.exports = router;
