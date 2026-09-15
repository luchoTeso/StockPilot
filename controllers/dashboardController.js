// controllers/dashboardController.js
const db = require('../config/database');

class DashboardController {
    static async getStats(req, res) {
        try {
            const tiendaId = req.session.tiendaId;
            
            // 1. Total Artículos (número de productos distintos en catálogo)
            const articulosQuery = `SELECT COUNT(*) as total FROM Productos WHERE id_tienda = ? AND estado = 'Disponible'`;
            const articulos = await db.getAsync(articulosQuery, [tiendaId]);

            // 2. Valor Inventario y Rentabilidad (Precio de venta * cantidad)
            const valorQuery = `
                SELECT 
                    SUM(cantidad * precio) as valor,
                    SUM((precio - costo_compra) * cantidad) as utilidad_potencial,
                    AVG(((precio - costo_compra) / NULLIF(precio, 0)) * 100) as margen_avg
                FROM Productos WHERE id_tienda = ?
            `;
            const valorRecord = await db.getAsync(valorQuery, [tiendaId]);

            // 3. Alertas Stock — solo leer, las alertas se regeneran al registrar ventas
            const Alert = require('../models/Alert');
            const alertasStats = await Alert.getStats(tiendaId);

            // 4. Ventas de hoy y del mes (filtradas por fecha en PostgreSQL)
            const ventasQuery = `
                SELECT
                    COALESCE(SUM(CASE WHEN fecha_salida::date = CURRENT_DATE THEN precio_total ELSE 0 END), 0) AS ventas_hoy,
                    COALESCE(SUM(CASE WHEN fecha_salida >= CURRENT_DATE - INTERVAL '30 days' THEN precio_total ELSE 0 END), 0) AS ventas_mes
                FROM Ventas WHERE id_tienda = ?
            `;
            const ventas = await db.getAsync(ventasQuery, [tiendaId]);

            // 5. Array 7 Días (Gráfica) — generate_series garantiza los 7 días sin depender de fechas de Node.js
            const ventasSemanalesQuery = `
              SELECT
                to_char(day, 'Dy') as dia_en,
                EXTRACT(DOW FROM day)::int as dow,
                COALESCE(SUM(v.precio_total), 0) as total
              FROM generate_series(
                CURRENT_DATE - INTERVAL '6 days',
                CURRENT_DATE,
                INTERVAL '1 day'
              ) AS day
              LEFT JOIN Ventas v
                ON v.fecha_salida::date = day
                AND v.id_tienda = ?
              GROUP BY day
              ORDER BY day ASC
            `;
            const ventasData = await db.allAsync(ventasSemanalesQuery, [tiendaId]) || [];
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const ultimos7Dias = ventasData.map(row => ({
                dia: diasSemana[Number(row.dow)],
                total: Number(row.total)
            }));

            res.json({
                totalArticulos: articulos.total || 0,
                valorInventario: valorRecord.valor || 0,
                utilidadPotencial: valorRecord.utilidad_potencial || 0,
                margenPromedio: Math.round(valorRecord.margen_avg || 0),
                // Proveer desglose avanzado al Frontend
                alertasCriticas: alertasStats.critico || 0,
                alertasAdvertencia: alertasStats.advertencia || 0,
                alertasStock: alertasStats.total || 0, // Fallback para ui legada
                ventasHoy: Number(ventas.ventas_hoy) || 0,
                ventasMes: Number(ventas.ventas_mes) || 0,
                ventasSemanales: ultimos7Dias
            });
        } catch (error) {
            console.error('Error en Dashboard Stats:', error);
            res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
        }
    }

    static async getAdvancedStats(req, res) {
        try {
            const tiendaId = req.session.tiendaId;
            if (!tiendaId) return res.status(401).json({ error: "Sesión no válida" });

            // 1. Proyección de Pérdidas por Vencimiento (Próximos 30 días)
            const riskQuery = `
                WITH BaseDatos AS (
                    SELECT 
                        id_producto as id, 
                        nombre_producto as nombre,
                        GREATEST(0, CEIL(EXTRACT(EPOCH FROM (fecha_vencimiento - CURRENT_TIMESTAMP))/86400)) as dias,
                        cantidad,
                        precio,
                        COALESCE((SELECT SUM(vp.cantidad) FROM VentasProductos vp JOIN Ventas v ON vp.id_venta = v.id_venta WHERE vp.id_producto = p.id_producto AND v.fecha_salida >= CURRENT_DATE - INTERVAL '30 days'), 0) / 30.0 as velocity
                    FROM Productos p
                    WHERE id_tienda = ? AND fecha_vencimiento IS NOT NULL AND cantidad > 0
                    AND fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' AND fecha_vencimiento > CURRENT_DATE
                ),
                Calculos AS (
                    SELECT 
                        id, nombre, dias,
                        ROUND(GREATEST(0, cantidad - (velocity * dias))) as "unidadesPerdidas",
                        ROUND(GREATEST(0, cantidad - (velocity * dias)) * precio) as "perdidaEstimada"
                    FROM BaseDatos
                )
                SELECT * FROM Calculos WHERE "unidadesPerdidas" > 0
                ORDER BY "perdidaEstimada" DESC
            `;
            const listaRiesgo = await db.allAsync(riskQuery, [tiendaId]);
            const top10Criticos = listaRiesgo.slice(0, 10);
            
            let totalPerdidaProyectada = 0;
            let productosEnRiesgo = listaRiesgo.length;
            listaRiesgo.forEach(item => {
                totalPerdidaProyectada += Number(item.perdidaEstimada);
            });

            // 2. Nivel de Servicio Estimado (% productos con stock > ROP)
            const servicioQuery = `
                WITH BaseDatos AS (
                    SELECT 
                        cantidad as stock_actual, stock_seguridad, lead_time,
                        COALESCE((SELECT SUM(vp.cantidad) FROM VentasProductos vp JOIN Ventas v ON vp.id_venta = v.id_venta WHERE vp.id_producto = p.id_producto AND v.fecha_salida >= CURRENT_DATE - INTERVAL '30 days'), 0) / 30.0 as velocity
                    FROM Productos p
                    WHERE id_tienda = ? AND estado = 'Disponible'
                )
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN stock_actual > ((velocity * lead_time) + stock_seguridad) THEN 1 END) as saludables
                FROM BaseDatos
            `;
            const statsServicio = await db.getAsync(servicioQuery, [tiendaId]);
            const totalProductos = Number(statsServicio.total) || 0;
            const productosSaludables = Number(statsServicio.saludables) || 0;
            const nivelServicio = totalProductos > 0 ? (productosSaludables / totalProductos) * 100 : 100;

            // 3. Comparativa de Ventas (30d actuales vs 30d anteriores)
            const comparativaQuery = `
                SELECT 
                    (SELECT SUM(precio_total) FROM Ventas WHERE id_tienda = ? AND fecha_salida >= CURRENT_DATE - INTERVAL '30 days') as actual,
                    (SELECT SUM(precio_total) FROM Ventas WHERE id_tienda = ? AND fecha_salida < CURRENT_DATE - INTERVAL '30 days' AND fecha_salida >= CURRENT_DATE - INTERVAL '60 days') as previo
            `;
            const comp = await db.getAsync(comparativaQuery, [tiendaId, tiendaId]);
            const variacionVentas = comp.previo > 0 ? ((comp.actual - comp.previo) / comp.previo) * 100 : 0;

            res.json({
                success: true,
                perdidasVencimiento: {
                    totalMonto: Math.round(totalPerdidaProyectada),
                    conteoProductos: productosEnRiesgo,
                    top10Criticos: top10Criticos
                },
                nivelServicio: {
                    porcentaje: Math.round(nivelServicio),
                    saludables: productosSaludables,
                    total: totalProductos
                },
                comparativaVentas: {
                    actual: comp.actual || 0,
                    previo: comp.previo || 0,
                    variacion: Math.round(variacionVentas)
                }
            });

        } catch (error) {
            console.error('Error en Advanced Stats:', error);
            res.status(500).json({ success: false, error: 'Error al procesar KPIs avanzados' });
        }
    }
}

module.exports = DashboardController;
