// scripts/apply_performance_indexes.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const indexes = [
    // 1. Productos (Consultas de catálogo, scanner, filtro por tienda)
    { name: 'idx_productos_tienda', sql: 'CREATE INDEX IF NOT EXISTS idx_productos_tienda ON Productos(id_tienda);' },
    { name: 'idx_productos_codigo', sql: 'CREATE INDEX IF NOT EXISTS idx_productos_codigo ON Productos(codigo);' },
    { name: 'idx_productos_tienda_estado', sql: 'CREATE INDEX IF NOT EXISTS idx_productos_tienda_estado ON Productos(id_tienda, estado);' },
    { name: 'idx_productos_tienda_nombre', sql: 'CREATE INDEX IF NOT EXISTS idx_productos_tienda_nombre ON Productos(id_tienda, nombre_producto);' },
    { name: 'idx_productos_proveedor', sql: 'CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON Productos(id_proveedor);' },

    // 2. Ventas y Detalle de Ventas (Crítico para reportes, cálculo de velocity y dashboard)
    { name: 'idx_ventas_tienda', sql: 'CREATE INDEX IF NOT EXISTS idx_ventas_tienda ON Ventas(id_tienda);' },
    { name: 'idx_ventas_tienda_fecha', sql: 'CREATE INDEX IF NOT EXISTS idx_ventas_tienda_fecha ON Ventas(id_tienda, fecha_salida DESC);' },
    { name: 'idx_ventas_vendedor', sql: 'CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON Ventas(id_vendedor);' },
    { name: 'idx_ventasprod_venta', sql: 'CREATE INDEX IF NOT EXISTS idx_ventasprod_venta ON VentasProductos(id_venta);' },
    { name: 'idx_ventasprod_producto', sql: 'CREATE INDEX IF NOT EXISTS idx_ventasprod_producto ON VentasProductos(id_producto);' },

    // 3. Movimientos de Stock (Historial y auditoría de inventario)
    { name: 'idx_movimientos_tienda_fecha', sql: 'CREATE INDEX IF NOT EXISTS idx_movimientos_tienda_fecha ON MovimientosStock(id_tienda, fecha_movimiento DESC);' },
    { name: 'idx_movimientos_producto', sql: 'CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON MovimientosStock(id_producto);' },
    { name: 'idx_movimientos_usuario', sql: 'CREATE INDEX IF NOT EXISTS idx_movimientos_usuario ON MovimientosStock(id_usuario);' },

    // 4. Alertas
    { name: 'idx_alertas_tienda_resuelta', sql: 'CREATE INDEX IF NOT EXISTS idx_alertas_tienda_resuelta ON Alertas(id_tienda, resuelta);' },
    { name: 'idx_alertas_tienda_fecha', sql: 'CREATE INDEX IF NOT EXISTS idx_alertas_tienda_fecha ON Alertas(id_tienda, fecha_creacion DESC);' },
    { name: 'idx_alertas_producto', sql: 'CREATE INDEX IF NOT EXISTS idx_alertas_producto ON Alertas(id_producto);' },

    // 5. Órdenes de Compra y Proveedores
    { name: 'idx_ordenes_tienda', sql: 'CREATE INDEX IF NOT EXISTS idx_ordenes_tienda ON Ordenes_Compra(id_tienda);' },
    { name: 'idx_ordenes_detalle_orden', sql: 'CREATE INDEX IF NOT EXISTS idx_ordenes_detalle_orden ON Ordenes_Detalle(id_orden);' },
    { name: 'idx_proveedores_tienda', sql: 'CREATE INDEX IF NOT EXISTS idx_proveedores_tienda ON Proveedores(id_tienda);' },

    // 6. Multi-Tienda y Usuarios
    { name: 'idx_tienda_propietario', sql: 'CREATE INDEX IF NOT EXISTS idx_tienda_propietario ON Tienda(id_propietario);' },
    { name: 'idx_usuarios_tienda', sql: 'CREATE INDEX IF NOT EXISTS idx_usuarios_tienda ON Usuarios(id_tienda);' },

    // 7. Historiales, Reportes e IA
    { name: 'idx_historial_producto', sql: 'CREATE INDEX IF NOT EXISTS idx_historial_producto ON Historial_Precios(id_producto);' },
    { name: 'idx_reportes_tienda', sql: 'CREATE INDEX IF NOT EXISTS idx_reportes_tienda ON reportes(id_tienda);' },
    { name: 'idx_auditoria_ia_tienda', sql: 'CREATE INDEX IF NOT EXISTS idx_auditoria_ia_tienda ON Auditoria_IA(id_tienda);' }
];

async function run() {
    console.log('⚡ Iniciando optimización de Base de Datos PostgreSQL...');
    const client = await pool.connect();
    let creados = 0;

    try {
        for (const idx of indexes) {
            const start = Date.now();
            await client.query(idx.sql);
            const duration = Date.now() - start;
            console.log(`  ✅ Índice [${idx.name}] verificado/creado (${duration}ms)`);
            creados++;
        }

        // Ejecutar ANALYZE para que el planificador estadístico de PostgreSQL use los nuevos índices
        console.log('\n📊 Actualizando estadísticas del optimizador de PostgreSQL (ANALYZE)...');
        await client.query('ANALYZE;');
        console.log(`🎉 ¡Optimización completada con éxito! Se aseguraron ${creados} índices estratégicos.`);
    } catch (err) {
        console.error('❌ Error aplicando índices:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
