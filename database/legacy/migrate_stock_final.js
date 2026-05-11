/**
 * Migración: Trazabilidad de Saldo Final
 * Añade la columna 'stock_final' a MovimientosStock para reportes operativos precisos.
 */
const db = require('../config/database');

async function migrate() {
    console.log('--- INICIANDO MIGRACIÓN: SALDO FINAL EN MOVIMIENTOS ---');
    try {
        // 1. Añadir columna stock_final
        await db.runAsync('ALTER TABLE MovimientosStock ADD COLUMN stock_final INTEGER');
        console.log('✅ Columna stock_final añadida a MovimientosStock');

        // 2. Poblar datos históricos (opcional, pero profesional)
        // Como no tenemos el histórico exacto, dejamos los anteriores en NULL o 0
        // pero los nuevos se guardarán correctamente.
        console.log('✅ Migración completada. Reinicie el servidor para aplicar cambios.');

    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('⚠️ La columna ya existe. Omitiendo.');
        } else {
            console.error('❌ Error en migración:', error.message);
        }
    }
}

migrate();
