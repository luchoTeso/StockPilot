const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'inventario.db');
const db = new sqlite3.Database(dbPath);

const runMutation = (query) => {
    return new Promise((resolve, reject) => {
        db.run(query, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

async function migrate() {
    console.log('🚀 Iniciando Migración: Inteligencia Financiera y Deuda...');

    try {
        // 1. Columnas en Productos (Rentabilidad y Reversión)
        console.log('  - Inyectando columnas en Productos...');
        try {
            await runMutation('ALTER TABLE Productos ADD COLUMN precio_original REAL');
            await runMutation('ALTER TABLE Productos ADD COLUMN fecha_fin_promocion TEXT');
            console.log('    ✓ precio_original y fecha_fin_promocion inyectados.');
        } catch (e) { console.log('    ~ Columnas en Productos ya existen o error menor.'); }

        // 2. Columnas en Ordenes_Compra (Deuda)
        console.log('  - Inyectando columnas en Ordenes_Compra...');
        try {
            await runMutation("ALTER TABLE Ordenes_Compra ADD COLUMN estado_pago TEXT DEFAULT 'Pendiente'");
            await runMutation('ALTER TABLE Ordenes_Compra ADD COLUMN monto_pagado REAL DEFAULT 0');
            console.log('    ✓ estado_pago y monto_pagado inyectados.');
        } catch (e) { console.log('    ~ Columnas en Ordenes_Compra ya existen o error menor.'); }

        // 3. Tabla Historial_Precios
        console.log('  - Creando tabla Historial_Precios...');
        await runMutation(`
            CREATE TABLE IF NOT EXISTS Historial_Precios (
                id_historial INTEGER PRIMARY KEY AUTOINCREMENT,
                id_producto INTEGER NOT NULL,
                precio_anterior REAL NOT NULL,
                precio_nuevo REAL NOT NULL,
                motivo TEXT,
                fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(id_producto) REFERENCES Productos(id_producto)
            )
        `);
        console.log('    ✓ Tabla Historial_Precios lista.');

        console.log('✅ Migración Financiera completada con éxito.');
        db.close();
    } catch (err) {
        console.error('❌ Error en migración:', err.message);
        db.close();
    }
}

migrate();
