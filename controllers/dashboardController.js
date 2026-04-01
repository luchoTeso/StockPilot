// controllers/dashboardController.js
const db = require('../config/database');

class DashboardController {
    static async getStats(req, res) {
        try {
            const tiendaId = req.session.tiendaId || 14;
            
            // 1. Total Artículos (Stock físico)
            const articulosQuery = `SELECT SUM(cantidad) as total FROM Productos WHERE id_tienda = ?`;
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
                valorInventario: valorRecord.valor || 0,
                utilidadPotencial: valorRecord.utilidad_potencial || 0,
                margenPromedio: Math.round(valorRecord.margen_avg || 0),
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

    static async getAdvancedStats(req, res) {
        try {
            const tiendaId = req.session.tiendaId;
            if (!tiendaId) return res.status(401).json({ error: "Sesión no válida" });

            // 1. Proyección de Pérdidas por Vencimiento (Próximos 30 días)
            const vencimientoQuery = `
                SELECT 
                    id_producto, nombre_producto, cantidad, precio, fecha_vencimiento,
                    IFNULL((SELECT SUM(vp.cantidad) FROM VentasProductos vp JOIN Ventas v ON vp.id_venta = v.id_venta WHERE vp.id_producto = p.id_producto AND v.fecha_salida >= DATE('now', '-30 days')), 0) / 30.0 as velocity
                FROM Productos p
                WHERE id_tienda = ? AND fecha_vencimiento IS NOT NULL 
                AND fecha_vencimiento <= DATE('now', '+30 days') AND fecha_vencimiento > DATE('now')
            `;
            const itemsVencimiento = await db.allAsync(vencimientoQuery, [tiendaId]);
            
            let totalPerdidaProyectada = 0;
            let productosEnRiesgo = 0;

            itemsVencimiento.forEach(item => {
                const hoy = new Date();
                const vanc = new Date(item.fecha_vencimiento);
                const diasRestantes = Math.max(0, Math.ceil((vanc - hoy) / (1000 * 60 * 60 * 24)));
                
                const ventasEstimadas = item.velocity * diasRestantes;
                const unidadesQueVenceran = Math.max(0, item.cantidad - ventasEstimadas);
                
                if (unidadesQueVenceran > 0) {
                    totalPerdidaProyectada += (unidadesQueVenceran * item.precio);
                    productosEnRiesgo++;
                }
            });

            // 2. Nivel de Servicio Estimado (% productos con stock > ROP)
            const servicioQuery = `
                SELECT 
                    p.id_producto, p.cantidad as stock_actual, p.stock_seguridad, p.lead_time,
                    IFNULL((SELECT SUM(vp.cantidad) FROM VentasProductos vp JOIN Ventas v ON vp.id_venta = v.id_venta WHERE vp.id_producto = p.id_producto AND v.fecha_salida >= DATE('now', '-30 days')), 0) / 30.0 as velocity
                FROM Productos p
                WHERE id_tienda = ? AND estado = 'Disponible'
            `;
            const todosLosProductos = await db.allAsync(servicioQuery, [tiendaId]);
            const totalProductos = todosLosProductos.length;
            
            let productosSaludables = 0;
            todosLosProductos.forEach(p => {
                const rop = (p.velocity * p.lead_time) + p.stock_seguridad;
                if (p.stock_actual > rop) {
                    productosSaludables++;
                }
            });

            const nivelServicio = totalProductos > 0 ? (productosSaludables / totalProductos) * 100 : 100;

            // 3. Comparativa de Ventas (30d actuales vs 30d anteriores)
            const comparativaQuery = `
                SELECT 
                    (SELECT SUM(precio_total) FROM Ventas WHERE id_tienda = ? AND fecha_salida >= DATE('now', '-30 days')) as actual,
                    (SELECT SUM(precio_total) FROM Ventas WHERE id_tienda = ? AND fecha_salida < DATE('now', '-30 days') AND fecha_salida >= DATE('now', '-60 days')) as previo
            `;
            const comp = await db.getAsync(comparativaQuery, [tiendaId, tiendaId]);
            const variacionVentas = comp.previo > 0 ? ((comp.actual - comp.previo) / comp.previo) * 100 : 0;

            res.json({
                success: true,
                perdidasVencimiento: {
                    totalMonto: Math.round(totalPerdidaProyectada),
                    conteoProductos: productosEnRiesgo
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
