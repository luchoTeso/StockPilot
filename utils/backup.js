const fs = require('fs');
const path = require('path');

/**
 * Realiza una copia de seguridad de la base de datos actual.
 * Guarda el archivo en la carpeta /backups con un nombre con fecha.
 */
function createBackup() {
    const dbPath = path.join(__dirname, '..', 'database', 'inventario.db');
    const backupsDir = path.join(__dirname, '..', 'backups');

    // Asegurar que la carpeta de backups exista
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Generar nombre de archivo: backup_YYYY-MM-DD_HH-mm.db
    const now = new Date();
    // Ajustar a Bogotá (Manual -5h)
    const bogotaNow = new Date(now.getTime() - (5 * 60 * 60 * 1000));
    const timestamp = bogotaNow.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
    const backupName = `backup_${timestamp}.db`;
    const backupPath = path.join(backupsDir, backupName);

    try {
        // Verificar si la BD origen existe
        if (!fs.existsSync(dbPath)) {
            console.log('⚠️ No se encontró inventario.db para respaldar.');
            return;
        }

        // Copiar el archivo
        fs.copyFileSync(dbPath, backupPath);
        console.log(`📦 Respaldo creado exitosamente: backups/${backupName}`);

        // Opcional: Limpiar backups viejos (mantener solo los últimos 10)
        const files = fs.readdirSync(backupsDir)
            .filter(f => f.startsWith('backup_'))
            .map(f => ({ name: f, time: fs.statSync(path.join(backupsDir, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 10) {
            files.slice(10).forEach(f => {
                fs.unlinkSync(path.join(backupsDir, f.name));
                console.log(`🧹 Backup antiguo eliminado: ${f.name}`);
            });
        }
    } catch (error) {
        console.error('❌ Error al crear el respaldo:', error.message);
    }
}

module.exports = { createBackup };
