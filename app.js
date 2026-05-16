// app.js - VERSIÓN MVC COMPLETA
require('dotenv').config();

// Validación temprana de variables de entorno obligatorias
if (!process.env.SESSION_SECRET) {
    console.error('❌ FATAL: SESSION_SECRET no está definido en las variables de entorno.');
    console.error('   Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
}

const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
// const { createBackup } = require('./utils/backup'); (Obsoleto en Postgres)
const { globalLimiter, authLimiter, aiLimiter } = require('./middleware/rateLimiter');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const reportRoutes = require('./routes/reportRoutes');
const tendederoRoutes = require('./routes/tendederoRoutes');
const exportRoutes = require('./routes/exportRoutes');
const seedRoutes = require('./routes/seedRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const aiRoutes = require('./routes/aiRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const alertRoutes = require('./routes/alertRoutes');
const auditRoutes = require('./routes/auditRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const scheduler = require('./services/schedulerService');

const app = express();
const PORT = process.env.PORT || 3001;

// 🛡️ REQUISITO PARA CLOUD (Railway/Heroku): Confiar en el proxy inverso
app.set('trust proxy', 1);

// Orígenes permitidos: leer desde env, con fallback para desarrollo local
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174'];

console.log('📍 Origins permitidos:', allowedOrigins);

// 🛡️ SEGURIDAD: Configuración de Helmet (Cabeceras de respuesta seguras)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", ...allowedOrigins]
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configuración del servidor
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));

const pgSession = require('connect-pg-simple')(session);
const db = require('./config/database');

// 🛡️ SEGURIDAD: Configuración de Sesión Hardened (Persistente en Postgres)
app.use(session({
    store: new pgSession({
        pool: db.pool,                // Usar el pool de conexiones de Postgres
        tableName: 'session',         // Se creará automáticamente o mediante init_pg.sql
        createTableIfMissing: true    // Auto-creación de tabla de sesiones
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, 
    cookie: { 
        secure: process.env.NODE_ENV === 'production', 
        httpOnly: true, 
        maxAge: 1000 * 60 * 60 * 24, // 24 horas
        sameSite: 'lax' 
    }
}));

// 🛡️ SEGURIDAD: Límite de peticiones (aplicado después de session para identificar por usuario)
app.use('/api/', globalLimiter);

// 🛡️ SEGURIDAD: Límite drástico en endpoints críticos (Fuerza Bruta)
app.use('/api/login', authLimiter);
app.use('/api/registro', authLimiter);
app.use('/api/forgot-password', authLimiter);
app.use('/api/reset-password', authLimiter);

// Usar rutas
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ia', aiLimiter, aiRoutes);
app.use('/', authRoutes);
app.use('/', storeRoutes);
app.use('/', productRoutes);
app.use('/', saleRoutes);
app.use('/', reportRoutes);
app.use('/', tendederoRoutes);
app.use('/', exportRoutes);
app.use('/', seedRoutes);
app.use('/', inventoryRoutes);
app.use('/', supplierRoutes);
app.use('/api/alertas', alertRoutes);
app.use('/api/auditoria', auditRoutes);
app.use('/api/feedback', feedbackRoutes);

// 🛡️ SEGURIDAD: Servir el Frontend en PRODUCCIÓN
if (process.env.NODE_ENV === 'production') {
    const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
    app.use(express.static(frontendDistPath));

    // Si no es una ruta de API, devuelve el index.html de React (Manejador SPA)
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(frontendDistPath, 'index.html'));
        }
    });
}

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    // Solo logueamos el error completo en el servidor
    console.error('❌ ERROR GLOBAL:', err);

    // En producción, silenciamos detalles técnicos peligrosos
    const isProd = process.env.NODE_ENV === 'production';
    
    res.status(500).json({ 
        success: false, 
        error: isProd 
            ? 'Lo sentimos, ha ocurrido un error interno. Intenta de nuevo más tarde.' 
            : `Error interno: ${err.message}` 
    });
});

// Manejo de rechazos no controlados
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ RECHAZO NO MANEJADO en:', promise, 'razón:', reason);
});

// ✅ ARRANQUE RESILIENTE PARA WINDOWS + NODEMON
let retries = 0;
const MAX_RETRIES = 5;

function startServer(port) {
    const server = app.listen(port);

    server.on('listening', async () => {
        retries = 0; // Reset en caso de éxito
        console.log('✅ Servidor MVC corriendo en puerto ' + port);
        console.log('📁 Arquitectura MVC completada exitosamente');
        console.log('📍 Orígenes CORS permitidos:', allowedOrigins.join(', '));
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            retries++;
            if (retries <= MAX_RETRIES) {
                console.log('⏳ Puerto ' + port + ' ocupado. Reintentando en 1.5s... (intento ' + retries + '/' + MAX_RETRIES + ')');
                setTimeout(() => startServer(port), 1500);
            } else {
                console.log('❌ No se pudo obtener el puerto ' + port + ' después de ' + MAX_RETRIES + ' intentos.');
                console.log('   Solución: Ejecuta en PowerShell -> Stop-Process -Id (Get-NetTCPConnection -LocalPort ' + port + ').OwningProcess -Force');
                process.exit(1);
            }
        } else {
            console.log('❌ Error de servidor:', err.message);
            process.exit(1);
        }
    });
}
// Iniciar planeador de tareas automáticas (Cron Jobs)
scheduler.startScheduler();

startServer(PORT);