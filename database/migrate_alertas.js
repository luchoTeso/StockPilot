const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'inventario.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error abriendo base de datos", err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    console.log("Creando tabla Alertas Inteligentes...");

    db.run(`
        CREATE TABLE IF NOT EXISTS Alertas (
            id_alerta INTEGER PRIMARY KEY AUTOINCREMENT,
            id_producto INTEGER NOT NULL,
            id_tienda INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            severidad TEXT NOT NULL,
            mensaje TEXT NOT NULL,
            datos_json TEXT,
            resuelta INTEGER DEFAULT 0,
            fecha_creacion TEXT DEFAULT (DATETIME('now','localtime')),
            fecha_resolucion TEXT,
            FOREIGN KEY (id_producto) REFERENCES Productos(id_producto),
            FOREIGN KEY (id_tienda) REFERENCES Tienda(id_tienda)
        )
    `, (err) => {
        if (err) {
            console.error("Error creando tabla Alertas:", err.message);
        } else {
            console.log("✅ Tabla Alertas creada exitosamente.");
        }
    });
});

db.close((err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("Migración MBI de Alertas completada.");
    }
});
