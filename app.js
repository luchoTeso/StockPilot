// app.js - VERSIÓN MVC COMPLETA
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { createBackup } = require('./utils/backup');
const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');

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

// 🛡️ SEGURIDAD: Configuración de Helmet (Cabeceras de respuesta seguras)
app.use(helmet({
    contentSecurityPolicy: false, // Se desactiva para compatibilidad con CDN de frontend durante dev
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 🛡️ SEGURIDAD: Límite de peticiones global (DDoS Protection)
app.use('/api/', globalLimiter);

// Configuración del servidor
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
    credentials: true
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// 🛡️ SEGURIDAD: Configuración de Sesión Hardened
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-dev-secret',
    resave: false,
    saveUninitialized: false, // No guardar sesiones vacías (Mejor cumplimiento GDPR)
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
        httpOnly: true, // No accesible por scripts (Previene XSS)
        maxAge: 1000 * 60 * 60 * 24, // 24 horas de vigencia
        sameSite: 'lax' // Protección básica CSRF
    }
}));

// 🛡️ SEGURIDAD: Límite drástico en endpoints críticos (Fuerza Bruta)
app.use('/api/login', authLimiter);
app.use('/api/registro', authLimiter);
app.use('/api/forgot-password', authLimiter);
app.use('/api/reset-password', authLimiter);

// Usar rutas
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ia', aiRoutes);
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

    server.on('listening', () => {
        retries = 0; // Reset en caso de éxito
        console.log('✅ Servidor MVC corriendo en http://localhost:' + port);
        
        // 📦 RESPALDO: Crear backup de la BD al iniciar el sistema
        createBackup();

        console.log('📁 Arquitectura MVC completada exitosamente');
        console.log('📍 Origin permitido: http://localhost:5173');

        const Sale = require('./models/Sale');
        Sale.ensureIndexes()
            .then(() => console.log('📊 Índices de BD verificados'))
            .catch(e => console.log('⚠️ No se pudieron crear índices:', e.message));
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