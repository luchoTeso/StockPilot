/**
 * Migración: Crear tabla Feedback_IA si no existe.
 * Módulo 14 — Aprendizaje Continuo.
 * 
 * Ejecutar: node database/migrate_feedback_ia.js
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'inventario.db');
const db = new sqlite3.Database(DB_PATH);

console.log('🧠 Migración Módulo 14: Feedback_IA');
console.log('📁 BD:', DB_PATH);

db.serialize(() => {
    // Crear tabla Feedback_IA
    db.run(`
        CREATE TABLE IF NOT EXISTS Feedback_IA (
            id_feedback INTEGER PRIMARY KEY AUTOINCREMENT,
            id_orden INTEGER NOT NULL,
            id_producto INTEGER NOT NULL,
            cantidad_sugerida INTEGER,
            ventas_reales_periodo INTEGER,
            factor_precision REAL,
            fecha_evaluacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(id_producto) REFERENCES Productos(id_producto)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creando Feedback_IA:', err.message);
        } else {
            console.log('✅ Tabla Feedback_IA creada/verificada correctamente.');
        }
    });

    // Verificar que Auditoria_IA también exista (por seguridad)
    db.run(`
        CREATE TABLE IF NOT EXISTS Auditoria_IA (
            id_auditoria INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha_auditoria TEXT DEFAULT (DATETIME('now')),
            id_tienda INTEGER,
            id_orden INTEGER,
            motor_ia TEXT DEFAULT 'gpt-4o-mini',
            prompt_utilizado TEXT,
            datos_base_json TEXT,
            sugerencia_ia_json TEXT,
            impacto_decision TEXT,
            razon_ia TEXT,
            FOREIGN KEY(id_tienda) REFERENCES Tienda(id_tienda)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error verificando Auditoria_IA:', err.message);
        } else {
            console.log('✅ Tabla Auditoria_IA verificada correctamente.');
        }
    });

    // Diagnóstico: mostrar cuántas órdenes aprobadas existen
    db.all(`
        SELECT o.id_orden, o.estado, COALESCE(o.fecha_aprobacion, o.fecha_creacion) as fecha, p.nombre_empresa
        FROM Ordenes_Compra o
        JOIN Proveedores p ON o.id_proveedor = p.id_proveedor
        WHERE o.estado IN ('Aprobada', 'Completada', 'Parcial')
        ORDER BY fecha DESC
    `, [], (err, rows) => {
        if (err) {
            console.error('⚠️ Error consultando órdenes:', err.message);
        } else {
            console.log(`\n📋 Órdenes elegibles para calibración: ${rows.length}`);
            rows.forEach(r => {
                console.log(`   → Orden #${r.id_orden} | ${r.nombre_empresa} | Estado: ${r.estado} | Fecha: ${r.fecha}`);
            });
        }

        db.close(() => {
            console.log('\n🏁 Migración completada.');
        });
    });
});
