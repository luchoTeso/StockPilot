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

            // 3. Alertas Stock — se regeneran en background para no bloquear la carga del dashboard
            const Alert = require('../models/Alert');
            Alert.generate(tiendaId).catch(e => console.error('Error regenerando alertas en dashboard:', e));
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
            const vencimientoQuery = `
                SELECT 
                    id_producto, nombre_producto, cantidad, precio, fecha_vencimiento,
                    COALESCE((SELECT SUM(vp.cantidad) FROM VentasProductos vp JOIN Ventas v ON vp.id_venta = v.id_venta WHERE vp.id_producto = p.id_producto AND v.fecha_salida >= CURRENT_DATE - INTERVAL '30 days'), 0) / 30.0 as velocity
                FROM Productos p
                WHERE id_tienda = ? AND fecha_vencimiento IS NOT NULL 
                AND fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' AND fecha_vencimiento > CURRENT_DATE
            `;
            const itemsVencimiento = await db.allAsync(vencimientoQuery, [tiendaId]);
            
            let totalPerdidaProyectada = 0;
            let productosEnRiesgo = 0;
            let listaRiesgo = [];

            itemsVencimiento.forEach(item => {
                const hoy = new Date();
                const vanc = new Date(item.fecha_vencimiento);
                const diasRestantes = Math.max(0, Math.ceil((vanc - hoy) / (1000 * 60 * 60 * 24)));
                
                const ventasEstimadas = item.velocity * diasRestantes;
                const unidadesQueVenceran = Math.max(0, item.cantidad - ventasEstimadas);
                
                if (unidadesQueVenceran > 0) {
                    const perdida = unidadesQueVenceran * item.precio;
                    totalPerdidaProyectada += perdida;
                    productosEnRiesgo++;
                    listaRiesgo.push({
                        id: item.id_producto,
                        nombre: item.nombre_producto,
                        dias: diasRestantes,
                        unidadesPerdidas: Math.round(unidadesQueVenceran),
                        perdidaEstimada: Math.round(perdida)
                    });
                }
            });
            
            // RF-041: Top 10 más críticos por pérdida estimada
            listaRiesgo.sort((a, b) => b.perdidaEstimada - a.perdidaEstimada);
            const top10Criticos = listaRiesgo.slice(0, 10);

            // 2. Nivel de Servicio Estimado (% productos con stock > ROP)
            const servicioQuery = `
                SELECT 
                    p.id_producto, p.cantidad as stock_actual, p.stock_seguridad, p.lead_time,
                    COALESCE((SELECT SUM(vp.cantidad) FROM VentasProductos vp JOIN Ventas v ON vp.id_venta = v.id_venta WHERE vp.id_producto = p.id_producto AND v.fecha_salida >= CURRENT_DATE - INTERVAL '30 days'), 0) / 30.0 as velocity
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
