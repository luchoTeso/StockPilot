// Configuración de PM2 para despliegue en VPS
// Uso:
//   pm2 start ecosystem.config.js             (arrancar)
//   pm2 restart stockpilot                    (reiniciar)
//   pm2 logs stockpilot                       (ver logs en tiempo real)
//   pm2 save && pm2 startup                   (arrancar automáticamente con el sistema)

module.exports = {
    apps: [
        {
            name: 'stockpilot',
            script: 'app.js',

            // Modo fork: un solo proceso (adecuado para esta app)
            // Cambia a 'cluster' y instances: 'max' si necesitas escalar en un servidor multicore
            instances: 1,
            exec_mode: 'fork',

            // Reinicio automático si el proceso cae
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',

            // Variables de entorno para producción
            // Los valores reales van en el archivo .env del servidor, no aquí
            env_production: {
                NODE_ENV: 'production',
                PORT: 3001,
            },

            // Logs
            out_file: './logs/out.log',
            error_file: './logs/error.log',
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss',

            // Esperar a que el proceso esté listo antes de marcar como "online"
            wait_ready: false,
            listen_timeout: 10000,
            kill_timeout: 5000,
        }
    ]
};
