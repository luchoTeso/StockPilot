/**
 * Migración: Integridad Financiera de Ventas
 * Añade 'precio_unitario' a VentasProductos para congelar el precio al momento de la venta.
 */
const db = require('../config/database');

async function migrate() {
    console.log('--- INICIANDO MIGRACIÓN: PRECIO HISTÓRICO EN VENTAS ---');
    try {
        // 1. Añadir columna precio_unitario a VentasProductos
        await db.runAsync('ALTER TABLE VentasProductos ADD COLUMN precio_unitario REAL');
        console.log('✅ Columna precio_unitario añadida a VentasProductos');

        // 2. Intentar poblar datos existentes para evitar ceros en reportes viejos
        console.log('--- ACTUALIZANDO PRECIOS HISTÓRICOS (FALLBACK) ---');
        await db.runAsync(`
            UPDATE VentasProductos 
            SET precio_unitario = (SELECT precio FROM Productos WHERE Productos.id_producto = VentasProductos.id_producto)
            WHERE precio_unitario IS NULL
        `);
        console.log('✅ Datos históricos actualizados con el precio actual');

    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('⚠️ La columna ya existe. Omitiendo.');
        } else {
            console.error('❌ Error en migración:', error.message);
        }
    } finally {
        process.exit(0);
    }
}

migrate();
