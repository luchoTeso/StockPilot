const rateLimit = require('express-rate-limit');

// Limitador de velocidad global (Protección contra DDoS y raspado de datos)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 150, // Límite de 150 peticiones por ventana de tiempo por IP
    message: {
        success: false,
        error: "Has realizado demasiadas peticiones. Por favor, inténtalo de nuevo en 15 minutos."
    },
    standardHeaders: true, // Retornar info del límite en headers (RateLimit-Limit)
    legacyHeaders: false, // Desactivar headers X-RateLimit-*
});

// Limitador específico para Login y Registro (Protección contra Fuerza Bruta)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Solo 10 intentos de login/registro permitidos por IP cada 15 minutos
    message: {
        success: false,
        error: "Demasiados intentos de acceso fallidos desde esta red. Por seguridad, el acceso ha sido bloqueado por 15 minutos."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter };
