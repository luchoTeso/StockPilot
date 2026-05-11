const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const Sale = require('../models/Sale');

/**
 * Migraciones de evolución de esquema (ALTER TABLE).
 * Se ejecutan después del CREATE TABLE IF NOT EXISTS para agregar columnas
 * que no existían en versiones anteriores de la base de datos.
 * Cada sentencia usa ADD COLUMN IF NOT EXISTS para ser idempotente.
 */
async function runAlterMigrations() {
    const alterations = [
        // v1.1 — precio unitario al momento de la venta
        `ALTER TABLE VentasProductos ADD COLUMN IF NOT EXISTS precio_unitario NUMERIC(15,2)`,
    ];

    for (const sql of alterations) {
        await db.pool.query(sql);
    }
    console.log('✅ Migraciones de esquema (ALTER) aplicadas.');
}

/**
 * Script de Migración Centralizado para PostgreSQL
 * Ejecuta el esquema base y asegura que las optimizaciones estén presentes.
 */
async function migrate() {
    console.log('🚀 Iniciando migración de StockPilot a PostgreSQL...');

    try {
        // 1. Cargar esquema inicial (Tablas, Constraints, Seeds Básicos)
        console.log('📄 Cargando esquema init_pg.sql...');
        const sqlPath = path.join(__dirname, '..', 'database', 'init_pg.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // El pool de PG permite ejecutar múltiples comandos separados por ';'
        await db.pool.query(sql);
        console.log('✅ Esquema base y tablas de sistema listas.');

        // 2. Aplicar columnas agregadas después de la creación inicial
        console.log('🔧 Aplicando migraciones de evolución de esquema...');
        await runAlterMigrations();

        // 3. Ejecutar optimizaciones de índices (Idempotente)
        console.log('📊 Verificando índices de rendimiento...');
        await Sale.ensureIndexes();

        console.log('✨ Proceso de migración completado exitosamente.');
        process.exit(0);
    } catch (error) {
        console.error('❌ ERROR CRÍTICO DURANTE LA MIGRACIÓN:');
        console.error(error.message);
        if (error.detail) console.error('Detalle:', error.detail);
        if (error.hint) console.error('Sugerencia:', error.hint);
        process.exit(1);
    }
}

migrate();
