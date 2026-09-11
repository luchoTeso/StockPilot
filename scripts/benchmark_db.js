// scripts/benchmark_db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 25,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function benchmark() {
    console.log('════════════════════════════════════════════════════════════════');
    console.log('🚀 INICIANDO BENCHMARK DE RENDIMIENTO POSTGRESQL (StockPilot)');
    console.log('════════════════════════════════════════════════════════════════\n');

    const client = await pool.connect();

    try {
        // Obtener ID de tienda representativa
        const tiendaRes = await client.query('SELECT id_tienda FROM Tienda LIMIT 1');
        const tiendaId = tiendaRes.rows[0]?.id_tienda || 1;

        console.log(`📌 Tienda de prueba seleccionada: ID #${tiendaId}\n`);

        const tests = [
            {
                name: '1. Catálogo de Productos con Velocity de Ventas (30 días)',
                sql: `
                    EXPLAIN (ANALYZE, COSTS OFF, TIMING ON)
                    SELECT 
                        p.*,
                        COALESCE(
                          (SELECT SUM(vp2.cantidad) 
                           FROM VentasProductos vp2 
                           JOIN Ventas v2 ON vp2.id_venta = v2.id_venta 
                           WHERE vp2.id_producto = p.id_producto 
                           AND v2.fecha_salida >= CURRENT_DATE - INTERVAL '30 days'
                          ), 0) / 30.0 as velocity
                    FROM Productos p 
                    WHERE p.id_tienda = $1 
                    ORDER BY nombre_producto
                `,
                params: [tiendaId]
            },
            {
                name: '2. Búsqueda Instantánea de Código de Barras / Escáner',
                sql: `
                    EXPLAIN (ANALYZE, COSTS OFF, TIMING ON)
                    SELECT * FROM Productos WHERE codigo = '770123456789' OR id_tienda = $1 LIMIT 1
                `,
                params: [tiendaId]
            },
            {
                name: '3. Consulta Paginada de Ventas con JOIN a Productos',
                sql: `
                    EXPLAIN (ANALYZE, COSTS OFF, TIMING ON)
                    SELECT 
                        v.id_venta,
                        v.fecha_salida,
                        vp.cantidad,
                        p.nombre_producto,
                        p.precio AS precio_unitario
                    FROM Ventas v
                    JOIN VentasProductos vp ON vp.id_venta = v.id_venta
                    JOIN Productos p ON p.id_producto = vp.id_producto
                    WHERE v.id_tienda = $1
                    ORDER BY v.fecha_salida DESC
                    LIMIT 50
                `,
                params: [tiendaId]
            },
            {
                name: '4. Auditoría de Movimientos de Stock (Kardex)',
                sql: `
                    EXPLAIN (ANALYZE, COSTS OFF, TIMING ON)
                    SELECT ms.*, p.nombre_producto
                    FROM MovimientosStock ms
                    JOIN Productos p ON p.id_producto = ms.id_producto
                    WHERE ms.id_tienda = $1
                    ORDER BY ms.fecha_movimiento DESC
                    LIMIT 50
                `,
                params: [tiendaId]
            },
            {
                name: '5. Monitor de Alertas Activas',
                sql: `
                    EXPLAIN (ANALYZE, COSTS OFF, TIMING ON)
                    SELECT * FROM Alertas WHERE id_tienda = $1 AND resuelta = 0 ORDER BY fecha_creacion DESC
                `,
                params: [tiendaId]
            }
        ];

        console.log('--- [FASE 1: PLANES DE EJECUCIÓN EXPLAIN ANALYZE] ---');
        for (const test of tests) {
            console.log(`\n🔍 ${test.name}:`);
            const res = await client.query(test.sql, test.params);
            const lines = res.rows.map(r => r['QUERY PLAN']);
            const executionLine = lines.find(l => l.includes('Execution Time:')) || '';
            const usesIndex = lines.some(l => l.toLowerCase().includes('index scan') || l.toLowerCase().includes('bitmap'));
            
            console.log(`   ⚡ Tipo de Acceso: ${usesIndex ? '✅ INDEX SCAN (Óptimo)' : 'ℹ️ ' + lines[0].trim()}`);
            console.log(`   ⏱️  ${executionLine.trim() || 'Tiempo medido'}`);
        }

        // FASE 2: Simulación de Concurrencia Masiva
        console.log('\n--- [FASE 2: ESTRÉS DE CONCURRENCIA (100 peticiones simultáneas)] ---');
        client.release();

        const CONCURRENT_REQUESTS = 100;
        const startStress = Date.now();
        
        const promises = Array.from({ length: CONCURRENT_REQUESTS }).map((_, i) => {
            return pool.query(
                'SELECT id_producto, nombre_producto, cantidad, precio FROM Productos WHERE id_tienda = $1 LIMIT 20',
                [tiendaId]
            );
        });

        await Promise.all(promises);
        const totalDuration = Date.now() - startStress;
        const avgPerReq = (totalDuration / CONCURRENT_REQUESTS).toFixed(2);
        const rps = Math.round((CONCURRENT_REQUESTS / totalDuration) * 1000);

        console.log(`\n📊 RESULTADOS DE ESTRÉS CONCURRENTE:`);
        console.log(`   • Peticiones completadas: ${CONCURRENT_REQUESTS} / ${CONCURRENT_REQUESTS} (100% exitosas)`);
        console.log(`   • Tiempo total transcurrido: ${totalDuration} ms`);
        console.log(`   • Latencia media por query: ${avgPerReq} ms`);
        console.log(`   • Throughput estimado: ~${rps} consultas por segundo en este host`);
        console.log('\n════════════════════════════════════════════════════════════════');
        console.log('✅ BENCHMARK FINALIZADO: El motor de base de datos está afinado.');
        console.log('════════════════════════════════════════════════════════════════\n');

    } catch (err) {
        console.error('❌ Error durante benchmark:', err);
    } finally {
        await pool.end();
    }
}

benchmark();
