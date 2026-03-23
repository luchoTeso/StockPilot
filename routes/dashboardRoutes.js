// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { requireLogin } = require('../middleware/auth');

router.get('/stats', requireLogin, DashboardController.getStats);

module.exports = router;
