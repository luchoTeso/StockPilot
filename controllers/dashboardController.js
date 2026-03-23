// controllers/dashboardController.js
const db = require('../config/database');

class DashboardController {
    static async getStats(req, res) {
        try {
            const tiendaId = req.session.tiendaId || 14;
            
            // 1. Total Artículos (Stock físico)
            const articulosQuery = `SELECT SUM(cantidad) as total FROM Productos WHERE id_tienda = ?`;
            const articulos = await db.getAsync(articulosQuery, [tiendaId]);

            // 2. Valor Inventario (Precio de venta * cantidad)
            const valorQuery = `SELECT SUM(cantidad * precio) as valor FROM Productos WHERE id_tienda = ?`;
            const valor = await db.getAsync(valorQuery, [tiendaId]);

            // 3. Alertas Stock (Avanzadas)
            const Alert = require('../models/Alert');
            // Auto-generar cada vez que alguien visita el dashboard (temporal hasta poner un cron)
            await Alert.generate(tiendaId);
            const alertasStats = await Alert.getStats(tiendaId);

            // 4. Ventas Recientes (Últimas 30 días de datos detectados en la BD para evitar ceros por desfase temporal)
            const ventasQuery = `SELECT SUM(precio_total) as ventas FROM Ventas WHERE id_tienda = ?`;
            const ventas = await db.getAsync(ventasQuery, [tiendaId]);

            // 5. Array 7 Días (Gráfica)
            const ventasSemanalesQuery = `
              SELECT DATE(fecha_salida) as fecha, SUM(precio_total) as total 
              FROM Ventas 
              WHERE id_tienda = ? AND fecha_salida >= DATE('now', '-6 days')
              GROUP BY DATE(fecha_salida)
              ORDER BY fecha ASC
            `;
            const ventasData = await db.allAsync(ventasSemanalesQuery, [tiendaId]) || [];
            const ultimos7Dias = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const fechaStr = d.toISOString().split('T')[0];
                const dataFech = ventasData.find(v => v.fecha === fechaStr);
                const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                ultimos7Dias.push({
                    dia: diasSemana[d.getDay()],
                    total: dataFech ? dataFech.total : 0
                });
            }

            res.json({
                totalArticulos: articulos.total || 0,
                valorInventario: valor.valor || 0,
                // Proveer desglose avanzado al Frontend
                alertasCriticas: alertasStats.critico || 0,
                alertasAdvertencia: alertasStats.advertencia || 0,
                alertasStock: alertasStats.total || 0, // Fallback para ui legada
                ventasMes: ventas.ventas || 0,
                ventasSemanales: ultimos7Dias
            });
        } catch (error) {
            console.error('Error en Dashboard Stats:', error);
            res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
        }
    }
}

module.exports = DashboardController;
