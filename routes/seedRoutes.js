// routes/seedRoutes.js
const express = require('express');
const SeedController = require('../controllers/seedController');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Solo administradores pueden ejecutar el seeder
router.post('/api/admin/seed', requireLogin, requireAdmin, SeedController.runSeed);

module.exports = router;
