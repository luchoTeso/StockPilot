// utils/logger.js
// Logging estructurado con Pino — OWASP A09: Security Logging & Monitoring
const pino = require('pino');
const path = require('path');
const fs = require('fs');

// Asegurar que la carpeta de logs exista
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const isProd = process.env.NODE_ENV === 'production';

// En producción: JSON puro a archivo + stdout
// En desarrollo: formato legible en terminal (pino-pretty fallback)
const logger = pino({
    level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
    timestamp: pino.stdTimeFunctions.isoTime,
    // Redactar campos sensibles automáticamente
    redact: {
        paths: [
            'req.headers.cookie',
            'req.headers.authorization',
            'password',
            'contrasena',
            'newPassword',
            'currentPassword',
            'session.secret',
            'OPENAI_API_KEY',
            'EMAIL_PASS',
            'RESEND_API_KEY'
        ],
        censor: '[REDACTADO]'
    },
    transport: isProd
        ? {
            targets: [
                // Archivo rotativo en producción
                {
                    target: 'pino/file',
                    options: { destination: path.join(logsDir, 'app.log') },
                    level: 'info'
                },
                // También stdout para Railway/Docker logs
                {
                    target: 'pino/file',
                    options: { destination: 1 }, // stdout
                    level: 'info'
                }
            ]
        }
        : {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:HH:MM:ss',
                ignore: 'pid,hostname',
            }
        }
});

/**
 * Middleware Express para logging de peticiones HTTP.
 * Registra método, URL, status code, duración y usuario.
 */
function requestLogger(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            userId: req.session?.userId || null,
            tiendaId: req.session?.tiendaId || null,
            ip: req.ip
        };

        if (res.statusCode >= 500) {
            logger.error(logData, 'Server Error');
        } else if (res.statusCode >= 400) {
            logger.warn(logData, 'Client Error');
        } else {
            logger.info(logData, 'Request');
        }
    });

    next();
}

/**
 * Registra un evento de seguridad significativo (login, logout, cambio de contraseña, etc.).
 */
function logSecurityEvent(event, details = {}) {
    logger.warn({ securityEvent: event, ...details }, `🛡️ SECURITY: ${event}`);
}

module.exports = { logger, requestLogger, logSecurityEvent };
