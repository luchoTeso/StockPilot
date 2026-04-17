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
        db.run("ALTER TABLE Usuarios ADD COLUMN cambio_clave_forzoso BOOLEAN DEFAULT 0", (alterErr) => {
            if (!alterErr) {
                console.log('🔧 Mantenimiento: Columna cambio_clave_forzoso inyectada existosamente.');
                // Aplicar regla al equipo actual exceptuando tendero1
                db.run("UPDATE Usuarios SET cambio_clave_forzoso = 1 WHERE rol = 'Tendedero' AND usuario != 'tendero1'");
            }
        });
        db.run("ALTER TABLE Usuarios ADD COLUMN reset_token TEXT", (e) => {
            if (!e) console.log('🔧 Mantenimiento: Columna reset_token inyectada.');
        });
        db.run("ALTER TABLE Usuarios ADD COLUMN reset_expires INTEGER", (e) => {
            if (!e) console.log('🔧 Mantenimiento: Columna reset_expires inyectada.');
        });
        db.run("ALTER TABLE Usuarios ADD COLUMN session_id TEXT", (e) => {
            if (!e) console.log('🛡️ Seguridad: Candado de sesión (session_id) inyectado en BD.');
        });
        db.run("ALTER TABLE Productos ADD COLUMN id_proveedor INTEGER", (e) => {
            if (!e) console.log('📦 Inventario: Columna id_proveedor vinculada exitosamente.');
        });
        db.run("ALTER TABLE Productos ADD COLUMN clasificacion_abc TEXT DEFAULT 'C'", (e) => {
            if (!e) console.log('📦 Inventario: Columna clasificacion_abc inyectada exitosamente.');
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