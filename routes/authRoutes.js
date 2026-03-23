// routes/authRoutes.js
const express = require('express');
const AuthController = require('../controllers/authController');
const { sanitizeBody, validateLogin, validateRegister } = require('../middleware/validation');
const router = express.Router();

router.post('/login', sanitizeBody, validateLogin, AuthController.login);
router.post('/registro', sanitizeBody, validateRegister, AuthController.register);
router.get('/api/session-info', AuthController.getSessionInfo);
router.get('/logout', AuthController.logout);

// Rutas de Perfil
router.get('/api/perfil', AuthController.getProfile);
router.put('/api/perfil', AuthController.updateProfile);
router.put('/api/perfil/password', AuthController.changePassword);

// Rutas de Recuperación
router.post('/api/forgot-password', AuthController.forgotPassword);
router.post('/api/verify-reset-code', AuthController.verifyResetCode);
router.post('/api/reset-password', AuthController.resetPasswordWithCode);

module.exports = router;