// middleware/auth.js
function requireLogin(req, res, next) {
    if (!req.session || !req.session.userId) {
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(401).json({ error: "No autenticado" });
        }
        return res.redirect('/');
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