const rateLimit = require('express-rate-limit');

// Clave por sesión de usuario (si está logueado) o por IP como fallback.
// Evita que múltiples vendedores de la misma red compartan el mismo contador.
const keyBySession = (req) => {
    return req.session?.userId
        ? `user_${req.session.userId}`
        : `ip_${req.ip}`;
};

// Limitador global: operaciones normales de la app (ventas, inventario, dashboard, etc.)
// 600 peticiones por 15 min por usuario — suficiente para un vendedor muy activo.
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    keyGenerator: keyBySession,
    message: {
        success: false,
        error: "Has realizado demasiadas peticiones. Por favor, inténtalo de nuevo en unos minutos."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/api/login') || req.path.startsWith('/api/registro'),
});

// Limitador para rutas de IA (costosas en tiempo y recursos del servidor).
// Más restrictivo que el global pero por usuario, no por IP.
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    keyGenerator: keyBySession,
    message: {
        success: false,
        error: "Has realizado muchas consultas a la IA. Espera unos minutos antes de continuar."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limitador para Login y Registro (Protección contra Fuerza Bruta).
// Este sí usa IP porque el usuario aún no tiene sesión.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        error: "Demasiados intentos de acceso fallidos desde esta red. Por seguridad, el acceso ha sido bloqueado por 15 minutos."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter, aiLimiter };
