// middleware/auth.js
const User = require('../models/User');
async function requireLogin(req, res, next) {
    if (!req.session || !req.session.userId) {
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(401).json({ error: "No autenticado" });
        }
        return res.redirect('/');
    }

    // VALIDACIÓN DE SESIÓN CONCURRENTE
    try {
        const isSessionValid = await User.verifyCurrentSession(req.session.userId, req.sessionID);
        if (!isSessionValid) {
            console.warn(`🛡️ SESIÓN INVALIDADA: El usuario ${req.session.userId} intentó usar una sesión antigua.`);
            
            // Destruir la sesión local porque ya existe una más nueva en otro lugar
            req.session.destroy();
            
            return res.status(401).json({ 
                error: "Sesión cerrada", 
                message: "Has iniciado sesión en otro dispositivo. Por seguridad, esta sesión ha sido cerrada.",
                code: "CONCURRENT_SESSION"
            });
        }
    } catch (error) {
        console.error('Error validando sesión concurrente:', error);
    }

    next();
}

function requireAdmin(req, res, next) {
    if (!req.session || req.session.rol !== 'Administrador') {
        return res.status(403).json({ error: "Se requieren permisos de administrador" });
    }
    next();
}

module.exports = { requireLogin, requireAdmin };