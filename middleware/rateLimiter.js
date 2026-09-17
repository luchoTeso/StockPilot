const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('../config/redis');

// Helper para obtener el store dinámico con prefijo único
const getStore = (prefix = 'rl:') => {
    return redisClient
        ? new RedisStore({
              sendCommand: (...args) => redisClient.sendCommand(args),
              prefix: prefix,
          })
        : undefined; // Fallback automático a MemoryStore
};

// Clave por sesión de usuario (si está logueado o en proceso de verificación 2FA) o por IP como fallback.
// Evita que múltiples vendedores de la misma red compartan el mismo contador.
// Usa ipKeyGenerator para normalizar direcciones IPv6 y prevenir bypasses de seguridad.
const keyBySession = (req) => {
    const userId = req.session?.userId || req.session?.pending2FA_userId;
    return userId
        ? `user_${userId}`
        : `ip_${ipKeyGenerator(req.ip)}`;
};

// Limitador global: operaciones normales de la app (ventas, inventario, dashboard, etc.)
// 600 peticiones por 15 min por usuario — suficiente para un vendedor muy activo.
const globalLimiter = rateLimit({
    store: getStore('rl_global:'),
    windowMs: 15 * 60 * 1000,
    max: 600,
    keyGenerator: keyBySession,
    message: {
        success: false,
        error: "Has realizado demasiadas peticiones. Por favor, inténtalo de nuevo en unos minutos."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/api/login') || req.path.startsWith('/api/registro') || req.path.startsWith('/api/2fa'),
});

// Limitador para rutas de IA (costosas en tiempo y recursos del servidor).
// Más restrictivo que el global pero por usuario, no por IP.
const aiLimiter = rateLimit({
    store: getStore('rl_ai:'),
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
// Este sí usa IP porque el usuario aún no tiene sesión iniciada.
// Solo penaliza intentos FALLIDOS (skipSuccessfulRequests: true).
const authLimiter = rateLimit({
    store: getStore('rl_auth:'),
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        error: "Demasiados intentos de acceso fallidos desde esta red. Por seguridad, el acceso ha sido bloqueado por 15 minutos."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limitador para validación de 2FA (Protección contra Fuerza Bruta de TOTP).
// Máximo 5 intentos por ventana de 15 minutos. Usa clave por usuario o IP.
// Solo penaliza intentos FALLIDOS (skipSuccessfulRequests: true).
const twoFactorLimiter = rateLimit({
    store: getStore('rl_2fa:'),
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    keyGenerator: keyBySession,
    message: {
        success: false,
        error: "Demasiados intentos de validación 2FA fallidos. Por seguridad, por favor espera 15 minutos."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter, aiLimiter, twoFactorLimiter };
