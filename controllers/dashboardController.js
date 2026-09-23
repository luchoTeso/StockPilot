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

    // getAdvancedStats se quitó en el plan 17 (Fase 5): GET /api/dashboard/stats/advanced no tenía
    // ningún consumidor en el frontend (ni perdidasVencimiento, ni nivelServicio, ni
    // comparativaVentas) — se verificó con una búsqueda en todo frontend/src antes de borrarlo.
}

module.exports = DashboardController;
