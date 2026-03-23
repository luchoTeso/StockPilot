// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'inventario.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log('✅ Conectado a la base de datos SQLite.');
        db.run("ALTER TABLE Usuarios ADD COLUMN foto_url TEXT", (alterErr) => {
            // Se ignora el error si la columna ya existe
            if (!alterErr) console.log('🔧 Mantenimiento: Columna foto_url inyectada exitosamente en Usuarios.');
        });
    }
});

/**
 * Retorna la fecha actual en formato YYYY-MM-DD ajustada a Bogotá
 */
db.getBogotaDate = function() {
    const now = new Date();
    // Ajuste manual de 5 horas
    const bogotaDate = new Date(now.getTime() - (5 * 60 * 60 * 1000));
    return bogotaDate.toISOString().split('T')[0];
};

// Promisify para usar async/await
db.runAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

db.getAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

db.allAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

module.exports = db;