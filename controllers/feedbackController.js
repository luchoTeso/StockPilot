/**
 * @file feedbackController.js
 * @description Controlador para el Módulo 14: Aprendizaje Continuo (Feedback IA).
 * Evalúa la precisión del oráculo comparando sus sugerencias vs. ventas reales.
 */

const db = require('../config/database');
const { safeError } = require('../utils/securityUtils');

const feedbackController = {
  /**
   * Evalúa una orden específica y registra/actualiza el factor de precisión.
   * Utiliza el criterio adaptativo: periodo = max(lead_time * 2, 14).
   * Puede invocarse manualmente o al cargar vistas de desempeño.
   */
  /* v8 ignore start */
  evaluateOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const ordenQuery = `SELECT id_orden, COALESCE(fecha_aprobacion, fecha_creacion) as fecha_aprobacion, estado, id_tienda FROM Ordenes_Compra WHERE id_orden = ?`;
      const orden = await db.getAsync(ordenQuery, [orderId]);

      if (!orden) return res.status(404).json({ success: false, error: 'Orden no encontrada' });
      if (!['Aprobada', 'Completada', 'Parcial'].includes(orden.estado)) {
        return res.status(400).json({ success: false, error: 'Solo se pueden evaluar órdenes aprobadas.' });
      }

      // 2. Obtener los detalles de la orden (sugerencias IA) y datos del producto (lead_time)
      const detallesQuery = `
        SELECT od.id_producto, od.sugerencia_ia, od.cantidad_final, p.lead_time, p.nombre_producto
        FROM Ordenes_Detalle od
        JOIN Productos p ON od.id_producto = p.id_producto
        WHERE od.id_orden = ?
      `;
      const detalles = await db.allAsync(detallesQuery, [orderId]);

      if (!detalles || detalles.length === 0) {
        return res.status(400).json({ success: false, error: 'La orden no tiene detalles.' });
      }

      // Fecha actual para calcular los días transcurridos
      const hoy = new Date();
      const fechaAprobacion = new Date(orden.fecha_aprobacion);
      // Diferencia en días
      const diffTime = Math.abs(hoy - fechaAprobacion);
      const diasTranscurridos = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

      const resultados = [];

      for (const det of detalles) {
        // Ignorar si la IA no sugirió nada y tampoco se vendió nada, aunque podríamos evaluarlo.
        // Si base matemática y IA dieron cosas parecidas.
        // Para simplificar, la IA sugiere una cantidad (sugerencia_ia es la respuesta de la IA o el diferencial,
        // dependemos de cómo se guardó. Si se guardó como cantidad total sugerida, usamos esa).
        // En Ordenes_Detalle, sugerencia_ia es lo que la IA sugirió en total o el diferencial (-/+) 
        // Asumiendo sugerencia_ia es la cantidad exacta o diferencial porcentual. 
        // En tu esquema: sugerencia_ia INTEGER /* Lo que dijo el oráculo */
        
        // Ventas reales desde la fecha de aprobación hasta hoy:
        const ventasQuery = `
          SELECT COALESCE(SUM(vp.cantidad), 0) as total_vendido
          FROM VentasProductos vp
          JOIN Ventas v ON vp.id_venta = v.id_venta
          WHERE vp.id_producto = ? AND v.fecha_salida >= ?
        `;
        const vRow = await db.getAsync(ventasQuery, [det.id_producto, orden.fecha_aprobacion]);
        const ventasReales = vRow ? Number(vRow.total_vendido) : 0;

        const periodoObjetivo = feedbackController.calcularPeriodoObjetivo(det.lead_time);
        const ventasProyectadasObjetivo = feedbackController.proyectarVentas(ventasReales, diasTranscurridos, periodoObjetivo);
        const sugerido = det.sugerencia_ia || det.cantidad_final; // Fallback a lo aprobado si IA no actuó
        const factor = feedbackController.calcularFactorPrecision(ventasProyectadasObjetivo, sugerido);

        // Guardar o actualizar en Feedback_IA
        // Verificamos si ya existe una evaluación para esta orden/producto
        const existeQuery = `SELECT id_feedback FROM Feedback_IA WHERE id_orden = ? AND id_producto = ?`;
        const existe = await db.getAsync(existeQuery, [orderId, det.id_producto]);

        if (existe) {
          await db.runAsync(
            `UPDATE Feedback_IA SET ventas_reales_periodo = ?, factor_precision = ?, fecha_evaluacion = CURRENT_TIMESTAMP WHERE id_feedback = ?`,
            [ventasReales, factor, existe.id_feedback]
          );
        } else {
          await db.runAsync(
            `INSERT INTO Feedback_IA (id_orden, id_producto, cantidad_sugerida, ventas_reales_periodo, factor_precision) VALUES (?, ?, ?, ?, ?)`,
            [orderId, det.id_producto, sugerido, ventasReales, factor]
          );
        }

        resultados.push({
          id_producto: det.id_producto,
          nombre_producto: det.nombre_producto,
          sugerido,
          ventasReales,
          ventasProyectadasObjetivo,
          factor_precision: factor.toFixed(2)
        });
      }

      res.json({
        success: true,
        message: 'Evaluación de IA completada con éxito',
        diasTranscurridos,
        evaluaciones: resultados
      });

    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: safeError(e, 'Error evaluando orden') });
    }
  },

  /**
   * Obtiene métricas globales de precisión para el Dashboard de Aprendizaje.
   */
  getGlobalPrecision: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      
      // 1. Precisión Promedio Global (últimos 30 días de evaluación o en general)
      const globalQuery = `
        SELECT AVG(f.factor_precision) as precision_global, COUNT(f.id_feedback) as total_evaluaciones
        FROM Feedback_IA f
        JOIN Ordenes_Compra o ON f.id_orden = o.id_orden
        WHERE o.id_tienda = ?
      `;
      const globalStats = await db.getAsync(globalQuery, [tiendaId]);

      // 2. Evolución temporal de la precisión (Mensual)
      const evolucionQuery = `
        SELECT TO_CHAR(f.fecha_evaluacion, 'YYYY-MM') as mes,
               AVG(f.factor_precision) as factor_promedio,
               COUNT(f.id_feedback) as volumen
        FROM Feedback_IA f
        JOIN Ordenes_Compra o ON f.id_orden = o.id_orden
        WHERE o.id_tienda = ?
        GROUP BY TO_CHAR(f.fecha_evaluacion, 'YYYY-MM')
        ORDER BY mes ASC
        LIMIT 6
      `;
      const evolucion = await db.allAsync(evolucionQuery, [tiendaId]);

      // 3. Top 5 productos más y menos predecibles
      const productosQuery = `
        SELECT p.id_producto, p.nombre_producto, p.categoria,
               AVG(f.factor_precision) as factor_historico,
               COUNT(f.id_feedback) as evaluaciones
        FROM Feedback_IA f
        JOIN Productos p ON f.id_producto = p.id_producto
        WHERE p.id_tienda = ?
        GROUP BY p.id_producto, p.nombre_producto, p.categoria
        HAVING COUNT(f.id_feedback) > 0
      `;
      const productosData = await db.allAsync(productosQuery, [tiendaId]);

      // Ordenar para predecibles (más cercano a 1.0)
      const ordenadoPorDistanciaA1 = [...productosData].sort((a, b) =>
        Math.abs(Number(a.factor_historico) - 1.0) - Math.abs(Number(b.factor_historico) - 1.0)
      );

      const topPredecibles = ordenadoPorDistanciaA1.slice(0, 5);
      const topImpredecibles = ordenadoPorDistanciaA1.reverse().slice(0, 5);

      res.json({
        success: true,
        data: {
          global: {
            promedio: Number(globalStats.precision_global) || 1.0,
            totalEval: Number(globalStats.total_evaluaciones) || 0
          },
          evolucion,
          topPredecibles,
          topImpredecibles,
          todos: productosData // Para la tabla detallada
        }
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: safeError(e, 'Error obteniendo métricas de precisión') });
    }
  },

  /**
   * Obtiene la lista de órdenes que son elegibles para evaluación.
   */
  getEvaluableOrders: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      
      const query = `
        SELECT o.id_orden, COALESCE(o.fecha_aprobacion, o.fecha_creacion) as fecha_aprobacion, o.estado, p.nombre_empresa as proveedor
        FROM Ordenes_Compra o
        JOIN Proveedores p ON o.id_proveedor = p.id_proveedor
        WHERE o.id_tienda = ? AND o.estado IN ('Aprobada', 'Completada', 'Parcial')
        ORDER BY fecha_aprobacion DESC
        LIMIT 50
      `;
      
      const ordenes = await db.allAsync(query, [tiendaId]);
      res.json({ success: true, data: ordenes });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: safeError(e, 'Error obteniendo órdenes evaluables') });
    }
  },
  /* v8 ignore stop */

  /** FUNCIONES PURAS PARA TESTING **/
  calcularPeriodoObjetivo: (leadTime) => Math.max((leadTime || 3) * 2, 14),
  proyectarVentas: (ventasReales, diasTranscurridos, periodoObjetivo) => {
    if (diasTranscurridos < periodoObjetivo) return (ventasReales / diasTranscurridos) * periodoObjetivo;
    return ventasReales;
  },
  calcularFactorPrecision: (ventasProyectadas, sugerido) => {
    let factor = 1.0;
    if (sugerido > 0) factor = ventasProyectadas / sugerido;
    else if (sugerido === 0 && ventasProyectadas > 0) factor = 2.0;
    return Math.min(Math.max(factor, 0.2), 3.0);
  },
  determinarVeredicto: (factor) => {
    if (factor >= 0.9 && factor <= 1.1) return 'Acertado';
    if (factor < 0.9) return 'Sugirió de más';
    return 'Sugirió de menos';
  }
};

module.exports = feedbackController;
