const db = require('../config/database');

class Alert {
  /**
   * Ejecuta el motor matemático y persiste las alertas
   */
  /* v8 ignore start */
  static async generate(tiendaId) {
    // 1. Marcar como resueltas TODAS las alertas actuales (se regeneran si aún aplican)
    await db.runAsync(`UPDATE Alertas SET resuelta = 1, fecha_resolucion = CURRENT_TIMESTAMP WHERE resuelta = 0 AND id_tienda = ?`, [tiendaId]);

    // 2. Extraer todos los productos con sus métricas de 30 y 7 días
    // Similar a suppliersController pero para TODOS los proveedores y productos
    const query = `
      SELECT 
        p.id_producto, p.nombre_producto, p.cantidad, p.stock_minimo, p.stock_maximo, 
        p.fecha_vencimiento, p.frecuencia_compra_dias, p.stock_seguridad, p.lead_time,
        p.precio,
        IFNULL((SELECT SUM(vp.cantidad) FROM VentasProductos vp JOIN Ventas v ON vp.id_venta = v.id_venta WHERE vp.id_producto = p.id_producto AND v.fecha_salida >= DATE('now', '-30 days')), 0) / 30.0 as velocity_30d,
        IFNULL((SELECT SUM(vp.cantidad) FROM VentasProductos vp JOIN Ventas v ON vp.id_venta = v.id_venta WHERE vp.id_producto = p.id_producto AND v.fecha_salida >= DATE('now', '-7 days')), 0) / 7.0 as velocity_7d
      FROM Productos p
      WHERE p.id_tienda = ? AND p.estado = 'Disponible'
    `;

    const productos = await db.allAsync(query, [tiendaId]);
    let generadas = 0;

    // Calcular Clasificación ABC en Memoria (Evita crash de SQLite por funciones de ventana)
    Alert.calcularClasificacionABC(productos);
    productos.forEach(p => {
        // RF-009 Fix: Persist calculated ABC class to DB
        db.runAsync('UPDATE Productos SET clasificacion_abc = ? WHERE id_producto = ?', [p.clasificacion_abc, p.id_producto]).catch(e => console.error('Error guardando ABC', e));
    });

    const hoy = new Date();
    // Neutralizar horas
    hoy.setHours(0,0,0,0);

    for (const prod of productos) {
      const v30 = prod.velocity_30d;
      const v7 = prod.velocity_7d;
      const leadTime = prod.lead_time || 3;
      const freqCompra = prod.frecuencia_compra_dias || 7;
      
      // Días de agotamiento (si no se vende, infinito)
      const diasAgotamiento = Alert.calcularDiasAgotamiento(prod.cantidad, v30);
      
      const logAlert = async (tipo, severidad, mensaje) => {
          const snapshot = JSON.stringify({ velocity_30d: v30, dias_agotamiento: diasAgotamiento, stock: prod.cantidad, lead_time: leadTime, class_abc: prod.clasificacion_abc, vencimiento: prod.fecha_vencimiento });
          await db.runAsync(
              `INSERT INTO Alertas (id_producto, id_tienda, tipo, severidad, mensaje, datos_json, resuelta) VALUES (?, ?, ?, ?, ?, ?, 0)`,
              [prod.id_producto, tiendaId, tipo, severidad, mensaje, snapshot]
          );
          generadas++;
      };

      // == REGLA 1 & 2: STOCK LOGÍSTICO (UMBRAL DINÁMICO) ==
      const alertaStock = Alert.determinarAlertaStock(diasAgotamiento, leadTime, freqCompra);
      if (alertaStock === 'stock_critico') {
          await logAlert('stock_critico', 'critico', `Stock agónico. Quedan ${diasAgotamiento} días de inventario y el proveedor tarda ${leadTime} días en entregar.`);
      } else if (alertaStock === 'stock_bajo') {
          await logAlert('stock_bajo', 'advertencia', `Ventana de pedido abierta. Te quedan ${diasAgotamiento} días de stock; ideal reabastecer ahora para mantener el ciclo sano.`);
      }

      // == REGLA 3 & 4: VENCIMIENTO MATEMÁTICO (CRUCE CON VELOCITY) ==
      if (prod.fecha_vencimiento) {
          const fVenc = new Date(prod.fecha_vencimiento);
          fVenc.setHours(0,0,0,0);
          const diasParaVencer = Math.floor((fVenc - hoy) / (1000 * 60 * 60 * 24));
          
          const alertaVencimiento = Alert.determinarAlertaVencimiento(prod.cantidad, v7, diasParaVencer);
          if (alertaVencimiento) {
              if (alertaVencimiento.tipo === 'vencimiento_critico') {
                  await logAlert('vencimiento_critico', 'critico', `Vence en ${diasParaVencer} días. Al ritmo actual, te sobrarán ~${alertaVencimiento.sobrantes} unidades invendibles.`);
              } else if (alertaVencimiento.tipo === 'vencimiento_proximo') {
                  await logAlert('vencimiento_proximo', 'advertencia', `Vence en ${diasParaVencer} días. Podrían sobrarte ~${alertaVencimiento.sobrantes} unidades. Sugerencia: Aplicar promoción hoy.`);
              }
          }
      }

      // == REGLA 5: SOBRESTOCK COMPROBADO (DINERO ATRAPADO) ==
      if (Alert.determinarSobrestock(prod.cantidad, prod.stock_maximo, prod.clasificacion_abc, diasAgotamiento)) {
          await logAlert('sobrestock', 'info', `Capital estancado. Tienes ${prod.cantidad} unidades, históricamente es un producto Clase C y tienes inventario inmóvil para más de 2 meses.`);
      }
    }

    return generadas;
  }

  /**
   * Obtiene las alertas activas, ordenadas por severidad
   */
  static async findActive(tiendaId, filters = {}) {
    let sql = `
      SELECT a.*, p.nombre_producto, p.codigo 
      FROM Alertas a 
      JOIN Productos p ON a.id_producto = p.id_producto 
      WHERE a.id_tienda = ? AND a.resuelta = 0
    `;
    const params = [tiendaId];

    if (filters.tipo) {
        sql += ` AND a.tipo = ?`;
        params.push(filters.tipo);
    }
    if (filters.severidad) {
        sql += ` AND a.severidad = ?`;
        params.push(filters.severidad);
    }
    
    // Orden críco -> advertencia -> info
    sql += ` ORDER BY CASE a.severidad WHEN 'critico' THEN 1 WHEN 'advertencia' THEN 2 ELSE 3 END, a.fecha_creacion DESC`;

    return await db.allAsync(sql, params);
  }

  /**
   * Resuelve (oculta) una alerta manualmente
   */
  static async resolve(idAlerta, tiendaId) {
    return await db.runAsync(`UPDATE Alertas SET resuelta = 1, fecha_resolucion = CURRENT_TIMESTAMP WHERE id_alerta = ? AND id_tienda = ?`, [idAlerta, tiendaId]);
  }

  /**
   * Retorna conteos agrupados para la UI (Dashboard / Sidebar)
   */
  static async getStats(tiendaId) {
    const rows = await db.allAsync(`
        SELECT severidad, COUNT(*) as count 
        FROM Alertas 
        WHERE id_tienda = ? AND resuelta = 0 
        GROUP BY severidad
    `, [tiendaId]);

    const stats = { critico: 0, advertencia: 0, info: 0, total: 0 };
    for (const r of rows) {
        if (stats[r.severidad] !== undefined) {
            stats[r.severidad] = r.count;
            stats.total += r.count;
        }
    }
    return stats;
  }
  /* v8 ignore stop */
  static calcularClasificacionABC(productos) {
    let totalRevenue = 0;
    productos.forEach(p => {
        p.rev30 = (p.velocity_30d || 0) * 30 * (p.precio || 0);
        totalRevenue += p.rev30;
    });
    
    productos.sort((a,b) => b.rev30 - a.rev30);
    let accum = 0;
    productos.forEach(p => {
        accum += p.rev30;
        const pct = totalRevenue > 0 ? (accum / totalRevenue) : 0;
        if (pct <= 0.8) p.clasificacion_abc = 'A';
        else if (pct <= 0.95) p.clasificacion_abc = 'B';
        else p.clasificacion_abc = 'C';
    });
    return productos;
  }

  static calcularDiasAgotamiento(cantidad, velocity30d) {
    return velocity30d > 0.01 ? Math.floor(cantidad / velocity30d) : 999;
  }

  static determinarAlertaStock(diasAgotamiento, leadTime, freqCompra) {
    if (diasAgotamiento <= leadTime) return 'stock_critico';
    if (diasAgotamiento <= (leadTime + freqCompra)) return 'stock_bajo';
    return null;
  }

  static determinarAlertaVencimiento(cantidad, velocity7d, diasParaVencer) {
    if (diasParaVencer < 0 || diasParaVencer > 30) return null;
    const ventasEstimadas = Math.floor(velocity7d * diasParaVencer);
    const quedaranSinVender = cantidad - ventasEstimadas;
    if (diasParaVencer <= 7 && quedaranSinVender > 0) return { tipo: 'vencimiento_critico', severidad: 'critico', sobrantes: quedaranSinVender };
    if (diasParaVencer <= 30 && quedaranSinVender > 0) return { tipo: 'vencimiento_proximo', severidad: 'advertencia', sobrantes: quedaranSinVender };
    return null;
  }

  static determinarSobrestock(cantidad, stockMaximo, clasificacionAbc, diasAgotamiento) {
    return cantidad > stockMaximo && clasificacionAbc === 'C' && diasAgotamiento > 60;
  }
}

module.exports = Alert;
