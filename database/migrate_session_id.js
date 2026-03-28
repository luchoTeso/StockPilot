const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'inventario.db');
const db = new sqlite3.Database(dbPath);

console.log('Iniciando migración de seguridad: Control de Sesiones Concurrentes...');

db.serialize(() => {
    // 1. Añadir la columna session_id si no existe
    db.run(`ALTER TABLE Usuarios ADD COLUMN session_id TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('❌ Error añadiendo columna session_id:', err.message);
        } else {
            console.log('✅ Columna session_id lista (o ya existía)');
        }
    });

    db.close((err) => {
        if (err) {
            console.error('❌ Error cerrando la base de datos:', err);
        } else {
            console.log('🎉 Migración completada exitosamente. La DB está lista para sesiones únicas.');
        }
    });
});
