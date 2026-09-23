/**
 * @file aiController.js
 * @description Controlador central para el motor de inteligencia de negocios (MBI).
 * Gestiona la integración con OpenAI, el procesamiento analítico de inventarios,
 * el sistema de caché segregado por tienda y la auditoría de decisiones.
 * 
 * @module controllers/aiController
 */

const db = require('../config/database');
const { OpenAI } = require('openai');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { safeError } = require('../utils/securityUtils');
const { seleccionarCandidatosReabastecimiento, esRecomendacionAccionable } = require('../utils/recomendacionesDashboard');
const { calcularReposicion, costoUnitario } = require('../utils/reposicion');

// Inicializar cliente OpenAI con la clave del entorno o una clave falsa para evitar crasheos al arrancar sin la variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_to_prevent_crash_on_startup'
});

// Ruta legada para auditoría de archivos (se mantiene por compatibilidad)
const AUDIT_LOG_PATH = path.join(__dirname, '..', 'ai_audit.log');

// Helper para escribir en el archivo de log (RF-026)
const logToAuditFile = (tiendaId, ordenId, razon, impacto) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] Tienda: ${tiendaId} | Orden: ${ordenId || 'N/A'} | Razón: ${razon} | Impacto: ${impacto}\n`;
    fs.appendFileSync(AUDIT_LOG_PATH, logEntry);
  } catch (err) {
    console.error('Error escribiendo en ai_audit.log:', err);
  }
};

/**
 * @typedef {Object} AICacheEntry
 * @property {string} dataHash - Hash MD5 de los datos de inventario consultados.
 * @property {Array} recommendations - Lista de recomendaciones generadas por la IA.
 * @property {Date} timestamp - Fecha y hora de la última actualización del caché.
 */

// Caché en memoria (rápido, se pierde en reinicios)
/** @type {Object.<string, AICacheEntry>} */
let aiCache_v3 = {};

// Helpers para caché persistente en PostgreSQL
const dbCacheGet = async (clave, currentHash) => {
  try {
    const row = await db.getAsync('SELECT datos_json, data_hash FROM Cache_IA WHERE clave = ?', [clave]);
    if (row && row.data_hash === currentHash) return JSON.parse(row.datos_json);
  } catch {
    // La caché en BD es opcional: ante cualquier fallo se recalcula.
  }
  return null;
};

const dbCacheSet = async (clave, currentHash, datos) => {
  try {
    await db.runAsync(
      `INSERT INTO Cache_IA (clave, data_hash, datos_json, actualizado_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT (clave) DO UPDATE SET data_hash = EXCLUDED.data_hash, datos_json = EXCLUDED.datos_json, actualizado_at = CURRENT_TIMESTAMP`,
      [clave, currentHash, JSON.stringify(datos)]
    );
  } catch {
    // La caché en BD es opcional: si no se puede guardar, no se interrumpe la respuesta.
  }
};

/**
 * AI Controller
 * Encapsula la lógica analítica y las interacciones con modelos de lenguaje.
 */
const aiController = {
  /**
   * Genera recomendaciones de reabastecimiento utilizando IA de OpenAI.
   * Utiliza un sistema de caché basado en hash para optimizar costos de API.
   * 
   * @async
   * @function getDashboardRecommendations
   * @param {import('express').Request} req - Objeto de petición Express.
   * @param {import('express').Response} res - Objeto de respuesta Express.
   * @returns {Promise<void>} Responde con un objeto JSON que contiene las recomendaciones.
   * @throws {Error} Si la API de OpenAI falla o hay errores de base de datos.
   */
  getDashboardRecommendations: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      if (!tiendaId) {
        return res.status(401).json({ error: "Sesión inválida o expirada. Por favor, inicie sesión nuevamente." });
      }

      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('tuLlaveSecreta')) {
        return res.status(500).json({ error: "La API Key de OpenAI no está configurada correctamente en el archivo .env." });
      }

      // 1. Obtener datos crudos con SQL optimizado (CTE + Window Functions para ABC y Sort)
      const snapshotQuery = `
        WITH VentasRecientes AS (
          SELECT vp.id_producto,
            SUM(CASE WHEN v.fecha_salida >= (CURRENT_DATE - INTERVAL '7 days') THEN vp.cantidad ELSE 0 END) as qty_7d,
            SUM(CASE WHEN v.fecha_salida >= (CURRENT_DATE - INTERVAL '30 days') THEN vp.cantidad ELSE 0 END) as qty_30d,
            SUM(CASE WHEN v.fecha_salida >= (CURRENT_DATE - INTERVAL '60 days') THEN vp.cantidad ELSE 0 END) as qty_60d,
            SUM(CASE WHEN v.fecha_salida >= (CURRENT_DATE - INTERVAL '90 days') THEN vp.cantidad ELSE 0 END) as qty_90d
          FROM Ventas v
          JOIN VentasProductos vp ON v.id_venta = vp.id_venta
          WHERE v.id_tienda = ?
          GROUP BY vp.id_producto
        ),
        PrecisionIA AS (
          SELECT id_producto, AVG(factor_precision) as avg_precision
          FROM Feedback_IA
          GROUP BY id_producto
        ),
        MathData AS (
          SELECT 
            p.id_producto as id, 
            p.nombre_producto as nombre, 
            p.cantidad as stock_actual, 
            p.precio, 
            p.categoria, 
            p.stock_seguridad, 
            p.lead_time,
            p.id_proveedor,
            p.costo_compra,
            prov.nombre_empresa as proveedor_nombre,
            COALESCE(vr.qty_30d, 0) as qty_30d_total,
            COALESCE(vr.qty_7d, 0) / 7.0 as velocity_7d,
            COALESCE(vr.qty_30d, 0) / 30.0 as velocity_30d,
            COALESCE(vr.qty_60d, 0) / 60.0 as velocity_60d,
            COALESCE(vr.qty_90d, 0) / 90.0 as velocity_90d,
            pia.avg_precision,
            (COALESCE(vr.qty_30d, 0) / 30.0) * 30 * p.precio as revenue
          FROM Productos p
          LEFT JOIN VentasRecientes vr ON p.id_producto = vr.id_producto
          LEFT JOIN PrecisionIA pia ON p.id_producto = pia.id_producto
          LEFT JOIN Proveedores prov ON prov.id_proveedor = p.id_proveedor
          WHERE p.id_tienda = ? AND p.estado = 'Disponible'
        ),
        AccumData AS (
          SELECT *,
            SUM(revenue) OVER () as totalRevenue,
            SUM(revenue) OVER (ORDER BY revenue DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as accum
          FROM MathData
        )
        SELECT *,
          CASE 
            WHEN totalRevenue = 0 THEN 'A'
            WHEN (accum / totalRevenue) <= 0.8 THEN 'A'
            WHEN (accum / totalRevenue) <= 0.95 THEN 'B'
            ELSE 'C'
          END as category,
          CASE 
            WHEN velocity_30d > 0.01 THEN (velocity_7d / velocity_30d) 
            ELSE 1 
          END as trend
        FROM AccumData
        ORDER BY revenue DESC
      `;
      // Pasamos dos veces el tiendaId: uno para VentasRecientes y otro para Productos
      const rows = await db.allAsync(snapshotQuery, [tiendaId, tiendaId]);
      
      // 2. Cálculo de Hash para Caché Inteligente (Usando MD5 para mantener compatibilidad con Cache_IA VARCHAR(32))
      const dataString = JSON.stringify(rows);
      const currentHash = crypto.createHash('md5').update(dataString).digest('hex');

      // 1. Memoria (instantáneo)
      const tiendaCache = aiCache_v3[tiendaId];
      if (tiendaCache && tiendaCache.dataHash === currentHash) {
        return res.json({ cached: true, recommendations: tiendaCache.recommendations });
      }
      // 2. BD (sobrevive reinicios de Railway — evita llamada a OpenAI si los datos no cambiaron)
      const dbCached = await dbCacheGet(`RECS_V4_${tiendaId}`, currentHash);
      if (dbCached) {
        aiCache_v3[tiendaId] = { dataHash: currentHash, recommendations: dbCached, timestamp: new Date() };
        return res.json({ cached: true, recommendations: dbCached });
      }

      console.log('--- AUDITOR: DETECTADO CAMBIO EN INVENTARIO. RECALCULANDO IA ---');

      // 3. Procesamiento Analítico (Tendencia y Variabilidad) mapeado directo
      const contextItemsFull = rows.map(item => {
        // Motor único de reposición (utils/reposicion.js): misma fórmula que Proveedores.
        const rep = calcularReposicion({
          ventasDia7: item.velocity_7d,
          ventasDia30: item.velocity_30d,
          ventas30Total: item.qty_30d_total,
          claseABC: item.category,
          stock: item.stock_actual,
          stockSeguridad: item.stock_seguridad,
          leadTime: item.lead_time,
        });
        const costo = costoUnitario({ costoCompra: item.costo_compra, precio: item.precio });

        return {
          id: item.id,
          nombre: item.nombre,
          stock: item.stock_actual,
          base_load: rep.cantidadBase,
          abc: item.category,
          trend_val: rep.tendencia,
          trend_label: rep.tendencia > 1.2 ? 'alcista' : (rep.tendencia < 0.8 ? 'bajista' : 'estable'),
          urgencia: rep.urgencia,
          dias_para_agotar: rep.diasParaAgotar,
          id_proveedor: item.id_proveedor,
          proveedor: item.proveedor_nombre,
          costo_unitario: costo.costo,
          costo_estimado: costo.estimado,
          velocity_long: { 
              d60: parseFloat(Number(item.velocity_60d || 0).toFixed(2)), 
              d90: parseFloat(Number(item.velocity_90d || 0).toFixed(2)) 
          },
          risk: rep.riesgo,
          avg_precision: item.avg_precision // Pasamos la precisión promedio para usarla luego
        };
      });

      // Solo se analizan los productos que realmente necesitan reposición (base_load > 0), los más urgentes primero.
      // Antes se enviaban los 8 más facturados aunque tuvieran stock de sobra: la IA "sugería aumentar" y se veía "+0u".
      const contextItemsForAI = seleccionarCandidatosReabastecimiento(contextItemsFull, 8);

      // Sin productos por reponer no hay nada que sugerir: se responde vacío y se evita una llamada a OpenAI.
      if (contextItemsForAI.length === 0) {
        aiCache_v3[tiendaId] = { dataHash: currentHash, recommendations: [], timestamp: new Date() };
        dbCacheSet(`RECS_V4_${tiendaId}`, currentHash, []);
        return res.json({ cached: false, recommendations: [] });
      }

      // 4. Llamada a OpenAI (Contexto Estructurado)
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `Eres el Asistente Copiloto de un dueño de negocio o administrador de Pyme. Analizarás un JSON de inventario de productos.
            Propondrás un AJUSTE porcentual sobre la cantidad base ('base_load').
            Límites de crecimiento: Clase A (max +100%), Clase B (max +50%), Clase C (max +20%).
            Responde ÚNICAMENTE con JSON: { "adjustments": [ { "id": ID, "adjustment": "+20%", "reason": "..." } ] }
            REGLA CRÍTICA PARA 'reason': Tu tono DEBE SER EMPÁTICO, DIRECTO Y COMERCIAL. Cero palabras técnicas (evita: "ROP", "tendencia bajista", "velocidad", "Clase A", "conservador"). Escribe de 20 a 35 palabras dando una justificación de negocio al usuario. Ejemplo: 'Este producto se está moviendo lento hoy, pero siempre se vende. Recomiendo pedir un poco para evitar quedarnos en ceros.'`
          },
          { 
            role: "user", 
            content: `Analiza y ajusta estos ítems críticos: ${JSON.stringify(contextItemsForAI)}` 
          }
        ],
        response_format: { type: "json_object" }
      });

      // 5. Normalización y Guardrails Dinámicos
      let aiResponse;
      try {
        aiResponse = JSON.parse(completion.choices[0].message.content);
      } catch {
        throw new Error("Fallo en parsing IA");
      }

      const rawAdjustments = Array.isArray(aiResponse.adjustments) ? aiResponse.adjustments : [];
      const finalRecommendations = rawAdjustments.map(adj => {
        // La IA a veces devuelve el id como texto ("12") o omite el ajuste: se compara como texto y se tolera un ajuste ausente.
        const original = contextItemsFull.find(i => String(i.id) === String(adj.id));
        if (!original) return null;

        // Extraer número del ajuste
        const adjNum = parseInt(String(adj.adjustment ?? '').replace(/[^0-9-]/g, '')) || 0;
        
        // Guardrails Dinámicos (Clamping)
        let limit = original.abc === 'A' ? 100 : (original.abc === 'B' ? 50 : 20);
        const clampedAdj = Math.min(Math.max(adjNum, -50), limit);

        const finalTotal = Math.ceil(original.base_load * (1 + clampedAdj/100));
        
        const result = {
          id_producto: original.id,
          id_proveedor: original.id_proveedor ?? null,
          proveedor: original.proveedor ?? null,
          costo_unitario: original.costo_unitario,
          costo_estimado: original.costo_estimado,
          urgencia: original.urgencia,
          dias_para_agotar: original.dias_para_agotar,
          product: original.nombre,
          base: original.base_load,
          adjustment: clampedAdj > 0 ? `+${clampedAdj}%` : `${clampedAdj}%`,
          final: finalTotal,
          reason: adj.reason,
          confidence: original.avg_precision !== null && original.avg_precision !== undefined 
                      ? Math.round(original.avg_precision * 100) 
                      : 50, // Fase 2: 50% por defecto si no hay historial para reflejar incertidumbre
          trend: original.trend_label
        };

        // Decision Log (Audit Trail) → BD en vez de archivo
        return result;
      }).filter(esRecomendacionAccionable); // descarta nulos y sugerencias de 0 unidades

      if (finalRecommendations.length === 0) {
        throw new Error("No se generaron recomendaciones válidas");
      }

      // 6. Auditoría en BD (Audit Trail)
      try {
        const datos_base = JSON.stringify(finalRecommendations.map(r => ({ product: r.product, base: r.base })));
        const sugerencia_json = JSON.stringify(finalRecommendations.map(r => ({ product: r.product, adjustment: r.adjustment, final: r.final, reason: r.reason })));
        
        await db.runAsync(
          'INSERT INTO Auditoria_IA (id_tienda, id_orden, prompt_utilizado, datos_base_json, sugerencia_ia_json, impacto_decision, razon_ia, fecha_auditoria) VALUES (?, NULL, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
          [tiendaId, 'Dashboard Auditor MBI v2.4', datos_base, sugerencia_json, 'Recomendaciones Dashboard', 'Análisis proactivo de inventario']
        );
        logToAuditFile(tiendaId, null, 'Análisis proactivo de inventario', 'Recomendaciones Dashboard');
      } catch (auditErr) {
        console.error('⚠️ Auditoría IA omitida:', auditErr.message);
      }

      // 6. Guardar en memoria y en BD (persiste entre reinicios)
      aiCache_v3[tiendaId] = { dataHash: currentHash, recommendations: finalRecommendations, timestamp: new Date() };
      dbCacheSet(`RECS_V4_${tiendaId}`, currentHash, finalRecommendations);

      res.json({ cached: false, recommendations: finalRecommendations });

    } catch (error) {
      console.error('❌ AUDITOR ERROR:', error);
      res.json({
        cached: false,
        error: true,
        recommendations: [
          { product: "Inventario Gral", base: "Check ROP", adjustment: "0%", final: "N/A", reason: "Motor IA en mantenimiento. Use el análisis de riesgo detallado.", confidence: 100, trend: "estable" }
        ]
      });
    }
  },

  /**
   * Genera un snapshot analítico del inventario basado en fórmulas matemáticas puras (ROP, ABC, Velocidad).
   * Este método no utiliza IA y sirve como base de datos para el motor predictivo.
   * 
   * @async
   * @function getAnalyticalSnapshot
   * @param {import('express').Request} req - Objeto de petición Express.
   * @param {import('express').Response} res - Objeto de respuesta Express.
   * @returns {Promise<void>} Responde con un JSON que contiene el análisis ABC y ROP.
   */
  getAnalyticalSnapshot: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      if (!tiendaId) return res.status(401).json({ error: "No autorizado" });
      const query = `
        WITH BaseData AS (
          SELECT
            p.id_producto,
            p.nombre_producto,
            p.cantidad as stock_actual,
            p.precio,
            p.costo_compra,
            p.id_proveedor,
            pr.nombre_empresa as proveedor,
            p.categoria,
            p.stock_seguridad,
            p.lead_time,
            COALESCE(
              (SELECT SUM(vp2.cantidad)
               FROM VentasProductos vp2
               JOIN Ventas v2 ON vp2.id_venta = v2.id_venta
               WHERE vp2.id_producto = p.id_producto AND v2.fecha_salida >= CURRENT_DATE - INTERVAL '30 days'
              ), 0) / 30.0 as velocidad_venta,
            COALESCE(
              (SELECT SUM(vp3.cantidad)
               FROM VentasProductos vp3
               JOIN Ventas v3 ON vp3.id_venta = v3.id_venta
               WHERE vp3.id_producto = p.id_producto AND v3.fecha_salida >= CURRENT_DATE - INTERVAL '7 days'
              ), 0) / 7.0 as velocidad_venta_7d
          FROM Productos p
          LEFT JOIN Proveedores pr ON pr.id_proveedor = p.id_proveedor
          WHERE p.id_tienda = ? AND p.estado = 'Disponible'
        ),
        MathData AS (
          SELECT *,
            (velocidad_venta * 30 * precio) as revenue,
            CASE WHEN velocidad_venta > 0.01 THEN ROUND(stock_actual / velocidad_venta) ELSE 999999 END as days_to_exhaust
          FROM BaseData
        ),
        AccumData AS (
          SELECT *,
            SUM(revenue) OVER () as totalRevenue,
            SUM(revenue) OVER (ORDER BY revenue DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as accum
          FROM MathData
        )
        SELECT *,
          CASE
            WHEN totalRevenue = 0 THEN 'A'
            WHEN (accum / totalRevenue) <= 0.8 THEN 'A'
            WHEN (accum / totalRevenue) <= 0.95 THEN 'B'
            ELSE 'C'
          END as category
        FROM AccumData
        ORDER BY revenue DESC
      `;

      const rows = await db.allAsync(query, [tiendaId]);

      // Mismo motor que el Consejero y Proveedores (utils/reposicion.js): antes esta pantalla
      // calculaba su propio "risk" (alto/medio/bajo) con una fórmula distinta a las demás,
      // así que un producto podía verse "en riesgo" aquí y "sano" en el Consejero.
      const finalData = rows.map(item => {
        const rep = calcularReposicion({
          ventasDia7: item.velocidad_venta_7d,
          ventasDia30: item.velocidad_venta,
          claseABC: item.category,
          stock: item.stock_actual,
          stockSeguridad: item.stock_seguridad,
          leadTime: item.lead_time,
        });
        const costo = costoUnitario({ costoCompra: item.costo_compra, precio: item.precio });

        return {
          id_producto: item.id_producto,
          id_proveedor: item.id_proveedor,
          proveedor: item.proveedor,
          nombre: item.nombre_producto,
          category: item.category,
          risk: rep.riesgo,
          urgencia: rep.urgencia,
          precio: item.precio,
          costo_unitario: costo.costo,
          costo_estimado: costo.estimado,
          cantidad_recomendada: rep.cantidadBase,
          velocity: item.velocidad_venta,
          stock_actual: item.stock_actual,
          stock_seguridad: item.stock_seguridad,
          lead_time: item.lead_time,
          // Postgres devuelve la rama ROUND(...) del CASE como numeric y la 999999 como entero;
          // node-postgres puede entregarlos con tipos distintos, así que se compara como número.
          days_to_exhaust: Number(item.days_to_exhaust) >= 999999 ? Infinity : Number(item.days_to_exhaust),
          revenue: Math.round(item.revenue),
          rop: rep.rop
        };
      });

      res.json({ success: true, data: finalData });
    } catch (e) {
      res.status(500).json({ success: false, error: safeError(e, 'Error en análisis de inventario') });
    }
  },

  /**
   * Genera sugerencias de promociones comerciales basadas en estacionalidad, 
   * baja rotación, sobrestock o riesgo de vencimiento.
   * 
   * @async
   * @function getPromotionSuggestions
   * @param {import('express').Request} req - Objeto de petición Express.
   * @param {import('express').Response} res - Objeto de respuesta Express.
   */
  getPromotionSuggestions: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      if (!tiendaId) return res.status(401).json({ error: "No autorizado" });

      // 1. Obtener candidatos con SQL optimizado (CTE)
      const query = `
        WITH VentasRecientes AS (
          SELECT 
            vp.id_producto,
            SUM(CASE WHEN v.fecha_salida >= CURRENT_DATE - INTERVAL '30 days' THEN vp.cantidad ELSE 0 END) as qty_30d,
            SUM(CASE WHEN v.fecha_salida >= CURRENT_DATE - INTERVAL '7 days' THEN vp.cantidad ELSE 0 END) as qty_7d
          FROM VentasProductos vp
          JOIN Ventas v ON vp.id_venta = v.id_venta
          WHERE v.fecha_salida >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY vp.id_producto
        )
        SELECT 
          p.id_producto as id, 
          p.nombre_producto as nombre, 
          p.cantidad as stock, 
          p.precio, 
          p.categoria, 
          p.fecha_vencimiento,
          p.precio_original,
          p.fecha_fin_promocion,
          COALESCE(vr.qty_30d, 0) / 30.0 as velocity_30d,
          COALESCE(vr.qty_7d, 0) / 7.0 as velocity_7d
        FROM Productos p
        LEFT JOIN VentasRecientes vr ON p.id_producto = vr.id_producto
        WHERE p.id_tienda = ? 
          AND p.estado = 'Disponible'
          AND (p.fecha_fin_promocion IS NULL OR p.fecha_fin_promocion < CURRENT_DATE)
          AND p.precio_original IS NULL
        ORDER BY p.cantidad DESC
      `;
      const rows = await db.allAsync(query, [tiendaId]);

      // 2. Filtrado Lógico (Candidatos: Tendencia baja, sobrestock o vencimiento)
      const candidates = rows.filter(r => {
        const trend = r.velocity_30d > 0.01 ? (r.velocity_7d / r.velocity_30d) : 0.5;
        const isLowTurnover = trend < 0.7 && r.stock > 10;
        const diasParaVencer = r.fecha_vencimiento
          ? (new Date(r.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
          : null;
        const isNearExpiry = diasParaVencer !== null && diasParaVencer < 30;
        const isOverstock = r.stock > 50 && r.velocity_30d < 1;
        return isLowTurnover || isNearExpiry || isOverstock;
      }).sort((a, b) => {
        // Productos con vencimiento próximo primero (más urgente arriba)
        // Los que no tienen fecha de vencimiento van al final
        const diasA = a.fecha_vencimiento
          ? (new Date(a.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
          : 9999;
        const diasB = b.fecha_vencimiento
          ? (new Date(b.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
          : 9999;
        return diasA - diasB;
      }).slice(0, 10);

      if (candidates.length === 0) {
        return res.json({ success: true, promotions: [] });
      }

      // 3. Hash para Caché (Independiente de recomendaciones de compra) (Usando MD5 para mantener compatibilidad con Cache_IA VARCHAR(32))
      const dataString = "PROMO_" + JSON.stringify(candidates);
      const currentHash = crypto.createHash('md5').update(dataString).digest('hex');
      
      const cacheKey = `PROMO_${tiendaId}`;
      if (aiCache_v3[cacheKey] && aiCache_v3[cacheKey].dataHash === currentHash) {
        return res.json({ cached: true, promotions: aiCache_v3[cacheKey].recommendations });
      }
      const dbCachedPromo = await dbCacheGet(cacheKey, currentHash);
      if (dbCachedPromo) {
        aiCache_v3[cacheKey] = { dataHash: currentHash, recommendations: dbCachedPromo, timestamp: new Date() };
        return res.json({ cached: true, promotions: dbCachedPromo });
      }

      // 3.5. Extraer contexto Human-in-the-Loop (Promociones Manuales Previas)
      let humanInTheLoopContext = "";
      try {
        const manualPromos = await db.allAsync(`
          SELECT pm.descuento_porcentaje, pm.motivo, p.nombre_producto, p.categoria, p.stock_minimo
          FROM Promociones_Manuales pm
          JOIN Productos p ON pm.id_producto = p.id_producto
          WHERE pm.id_tienda = ?
          ORDER BY pm.fecha_creacion DESC
          LIMIT 10
        `, [tiendaId]);
        
        if (manualPromos && manualPromos.length > 0) {
          humanInTheLoopContext = "\n\nEJEMPLOS DE DECISIONES DEL DUEÑO (Aprende de su estilo para sugerir descuentos similares):\n" +
            manualPromos.map(mp => `- Producto: "${mp.nombre_producto}", Categoria: ${mp.categoria}, Descuento Aplicado: ${mp.descuento_porcentaje}%. Motivo del dueño: "${mp.motivo}"`).join('\n');
        }
      } catch (err) {
        console.error("Error obteniendo promociones manuales para IA:", err);
      }

      // 4. Prompt de Estrategia Comercial
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `Eres un Experto en Retail y Estrategia de Ventas. Analizarás productos estancados o en riesgo de pérdida.
            Tu misión es proponer estrategias COMERCIALES (no logísticas).${humanInTheLoopContext}
            TIPOS PERMITIDOS: 'descuento', 'combo', '2x1', 'liquidacion'.
            REGLAS:
            - Descuento máximo: 30%.
            - Si el tipo es '2x1', el campo 'discount' DEBE SER 50 (porque el cliente paga 1 y lleva 2, es decir, ahorra el 50%).
            - Los 'combos' deben ser lógicos y estratégicos.
            - TONO: Consultivo, ejecutivo y analítico.
            - ESTILO: Escribe un párrafo fluido, natural y profesional de 35 a 50 palabras. NO uses etiquetas como '(Diagnóstico)' o '(Objetivo)'.
            - LÓGICA: Conecta la causa técnica (ej: baja rotación, sobrestock) con el beneficio estratégico (ej: recuperar liquidez, optimizar espacio) usando conectores naturales.
            - EJEMPLO: 'Dado que la rotación de [Producto] ha sido nula en los últimos 20 días, se sugiere este descuento para recuperar el capital inmovilizado y optimizar el espacio en estantería para productos de mayor demanda.'
            - EXTENSIÓN: Entre 35 y 50 palabras.
            - DURACIÓN: Sugiere una duración lógica en 'duration_days'.
            - COMBOS: Si es 'combo', identifica un producto afín y pon su nombre en 'complementary_name'.
            - COBERTURA OBLIGATORIA: Debes generar exactamente UNA sugerencia por CADA producto del array. No puedes omitir ninguno.
            - Responde ÚNICAMENTE JSON: { "promotions": [ { "id": ID, "type": "TIPO", "title": "Título corto", "reason": "Justificación profesional fluida", "duration_days": 15, "complementary_name": "Nombre o null", "discount": 15 } ] }`
          },
          { role: "user", content: `Genera una estrategia promocional para CADA uno de estos ${candidates.length} productos (uno por uno, sin omitir ninguno): ${JSON.stringify(candidates)}` }
        ],
        response_format: { type: "json_object" }
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content);
      const promotions = (aiResponse.promotions || []).map(p => {
        const product = candidates.find(c => c.id === p.id);
        if (!product) return null;

        // Corrección automática: 2x1 siempre es 50% de ahorro real
        let effectiveDiscount = p.discount || 0;
        if (p.type === '2x1' && effectiveDiscount === 0) {
          effectiveDiscount = 50;
        }

        // Cálculo de impacto financiero estimado (Capital a liberar)
        const discountFactor = effectiveDiscount / 100;
        const discountedPrice = Math.round(product.precio * (1 - discountFactor));
        const capitalLiberado = Math.round(product.stock * discountedPrice);

        return {
          ...p,
          id: product.id, // ID explícito de la base de datos
          discount: effectiveDiscount,
          productName: product.nombre,
          originalPrice: product.precio,
          discountedPrice: discountedPrice,
          impact: capitalLiberado,
          isCritical: product.fecha_vencimiento && (new Date(product.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24) < 10
        };
      }).filter(p => p !== null);

      // Fallback: cubrir candidatos que la IA omitió con reglas deterministas
      const coveredIds = new Set(promotions.map(p => p.id));
      for (const product of candidates) {
        if (coveredIds.has(product.id)) continue;

        const diasParaVencer = product.fecha_vencimiento
          ? (new Date(product.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
          : null;

        let type, discount, reason, duration_days;

        if (diasParaVencer !== null && diasParaVencer <= 10) {
          type = 'liquidacion'; discount = 25; duration_days = Math.max(3, Math.floor(diasParaVencer));
          reason = `Vence en ${Math.round(diasParaVencer)} días y al ritmo actual no se agotará. Una liquidación urgente permite recuperar capital antes de la pérdida total del inventario.`;
        } else if (diasParaVencer !== null && diasParaVencer <= 30) {
          type = 'descuento'; discount = 15; duration_days = 7;
          reason = `Con vencimiento próximo en ${Math.round(diasParaVencer)} días, un descuento moderado acelera la rotación y evita pérdidas por producto no vendido a tiempo.`;
        } else if (product.stock > 50) {
          type = 'combo'; discount = 10; duration_days = 14;
          reason = `El alto nivel de stock genera capital inmovilizado. Un combo estratégico incentiva la compra conjunta y mejora la rotación sin sacrificar demasiado margen.`;
        } else {
          type = 'descuento'; discount = 15; duration_days = 10;
          reason = `La baja rotación reciente de este producto sugiere que un descuento puntual puede reactivar la demanda y liberar espacio en estantería para productos de mayor salida.`;
        }

        const discountedPrice = Math.round(product.precio * (1 - discount / 100));
        promotions.push({
          id: product.id,
          type,
          title: product.nombre,
          reason,
          duration_days,
          complementary_name: null,
          discount,
          productName: product.nombre,
          originalPrice: product.precio,
          discountedPrice,
          impact: Math.round(product.stock * discountedPrice),
          isCritical: diasParaVencer !== null && diasParaVencer <= 10
        });
      }

      // 5. Guardar en memoria y BD
      aiCache_v3[cacheKey] = { dataHash: currentHash, recommendations: promotions, timestamp: new Date() };
      dbCacheSet(cacheKey, currentHash, promotions);

      // Registrar en BD (Auditoria_IA)
      try {
        await db.runAsync(
          'INSERT INTO Auditoria_IA (id_tienda, id_orden, prompt_utilizado, datos_base_json, sugerencia_ia_json, impacto_decision, razon_ia) VALUES (?, NULL, ?, ?, ?, ?, ?)',
          [
            tiendaId, 
            'Estratega Comercial v1.2', 
            JSON.stringify(candidates), 
            JSON.stringify(promotions), 
            'Sugerencias de Promoción', 
            'Optimización de flujo de caja'
          ]
        );
        logToAuditFile(tiendaId, null, 'Optimización de flujo de caja', 'Sugerencias de Promoción');
      } catch (err) { console.error('Error auditoría promo:', err); }

      res.json({ cached: false, promotions });

    } catch (error) {
      console.error('Error promotion suggestions:', error);
      res.status(500).json({ error: safeError(error, 'Error generando sugerencias de promoción') });
    }
  },

  /**
   * Obtiene alertas críticas basadas en reglas de negocio estrictas (Punto de Reorden).
   * Cruza datos de stock actual contra el modelo de predicción de demanda.
   * 
   * @async
   * @function getProAlerts
   * @param {import('express').Request} req - Objeto de petición Express.
   * @param {import('express').Response} res - Objeto de respuesta Express.
   */
  getProAlerts: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      const Product = require('../models/Product');
      const alerts = await Product.findProAlerts(tiendaId);
      
      res.json({ success: true, alerts });
    } catch (e) {
      res.status(500).json({ error: safeError(e, 'Error obteniendo alertas') });
    }
  },

  /**
   * Aplica una estrategia de precio sugerida por la IA.
   * Guarda el precio original para restauraciones automáticas.
   */
  applyPromotionStrategy: async (req, res) => {
    try {
      const { id_producto, nuevo_precio, duration_days, razon, tipo } = req.body;
      const tiendaId = req.session.tiendaId;

      if (!id_producto || !nuevo_precio) {
        return res.status(400).json({ error: "Datos incompletos" });
      }

      // 1. Obtener datos actuales del producto
      const current = await db.getAsync('SELECT precio, nombre_producto FROM Productos WHERE id_producto = ? AND id_tienda = ?', [id_producto, tiendaId]);
      if (!current) return res.status(404).json({ error: "Producto no encontrado" });

      const precioAnterior = current.precio;
      const fechaFin = new Date();
      fechaFin.setDate(fechaFin.getDate() + (parseInt(duration_days) || 7));
      const fechaFinStr = fechaFin.toISOString().split('T')[0];

      // 2. Transacción de actualización (Postgres Client)
      const client = await db.getClient();

      try {
        await client.query('BEGIN');

        // Actualizar precio y guardar original (solo si no tiene ya un precio original guardado)
        await client.query(
          `UPDATE Productos 
           SET precio = ?, 
               precio_original = COALESCE(precio_original, ?), 
               fecha_fin_promocion = ? 
           WHERE id_producto = ?`,
          [nuevo_precio, precioAnterior, fechaFinStr, id_producto]
        );

        // Registrar en Historial_Precios
        await client.query(
          `INSERT INTO Historial_Precios (id_producto, precio_anterior, precio_nuevo, motivo) 
           VALUES (?, ?, ?, ?)`,
          [id_producto, precioAnterior, nuevo_precio, `Estrategia IA: ${tipo} - ${razon}`]
        );

        // Auditoría IA completa
        await client.query(
          `INSERT INTO Auditoria_IA (id_tienda, id_orden, prompt_utilizado, datos_base_json, sugerencia_ia_json, impacto_decision, razon_ia) 
           VALUES (?, NULL, ?, ?, ?, ?, ?)`,
          [
            tiendaId, 
            'Ejecución Estrategia Directa', 
            JSON.stringify([{ id: id_producto, product: current.nombre_producto, base: precioAnterior }]), 
            JSON.stringify([{ 
                id: id_producto,
                product: current.nombre_producto, 
                adjustment: `${Math.round(((nuevo_precio - precioAnterior) / precioAnterior) * 100)}%`, 
                final: nuevo_precio, 
                reason: razon 
            }]),
            'ESTRATEGIA APLICADA', 
            `Ajuste de precio automático: ${razon}`
          ]
        );
        logToAuditFile(tiendaId, null, `Ajuste de precio automático: ${razon}`, 'ESTRATEGIA APLICADA');

        await client.query('COMMIT');
        res.json({ success: true, message: "Estrategia aplicada con éxito y registrada en auditoría." });

      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Error aplicando estrategia IA:', error);
      res.status(500).json({ error: safeError(error, 'Error aplicando estrategia') });
    }
  },

  /**
   * Obtiene la tendencia de precios histórica para gráficas.
   */
  getPriceTrend: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      const query = `
        SELECT hp.*, p.nombre_producto, hp.fecha_cambio 
        FROM Historial_Precios hp
        JOIN Productos p ON hp.id_producto = p.id_producto
        WHERE p.id_tienda = ?
        ORDER BY hp.fecha_cambio ASC
        LIMIT 100
      `;
      const rows = await db.allAsync(query, [tiendaId]);
      
      // Agrupar por fecha para la gráfica
      // fecha_cambio es un Date object en node-postgres (TIMESTAMPTZ); convertir a string ISO
      const trend = rows.map(r => ({
        fecha: new Date(r.fecha_cambio).toISOString().split('T')[0],
        producto: r.nombre_producto,
        precioAnterior: Number(r.precio_anterior),
        precioNuevo: Number(r.precio_nuevo),
        variacion: Number(r.precio_nuevo) - Number(r.precio_anterior)
      }));

      res.json({ success: true, trend });
    } catch (e) {
      res.status(500).json({ error: safeError(e, 'Error obteniendo tendencia de precios') });
    }
  },

  /**
   * Sugerencia dinámica de alertas de inventario (Stock Mínimo, Stock Seguridad, Lead Time)
   * GET /api/ia/suggest-alerts?id_producto=X&categoria=Y&id_proveedor=Z
   */
  suggestStockAlerts: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      if (!tiendaId) return res.status(401).json({ error: "Sesión inválida" });
      const { id_producto, categoria, id_proveedor } = req.query;

      let avgDailySales = 0;
      let suggestedLeadTime = 3; // Valor por defecto seguro (3 días)

      if (id_producto) {
        // 1. Producto Existente: Ventas promedio del propio producto en los últimos 30 días
        const salesRows = await db.allAsync(`
          SELECT COALESCE(SUM(vp.cantidad), 0) / 30.0 AS avg_daily
          FROM VentasProductos vp
          JOIN Ventas v ON vp.id_venta = v.id_venta
          WHERE vp.id_producto = ? AND v.fecha_salida >= CURRENT_DATE - INTERVAL '30 days'
        `, [id_producto]);
        
        if (salesRows.length > 0 && salesRows[0].avg_daily > 0) {
          avgDailySales = parseFloat(salesRows[0].avg_daily);
        }

        // Obtener el lead_time actual del producto (si lo tiene)
        const prodRows = await db.getAsync(`SELECT lead_time FROM Productos WHERE id_producto = ?`, [id_producto]);
        if (prodRows && prodRows.lead_time > 0) {
          suggestedLeadTime = prodRows.lead_time;
        }

      } else if (categoria) {
        // 2. Producto Nuevo: Velocidad promedio de ventas de otros productos de la MISMA CATEGORÍA
        const catSales = await db.allAsync(`
          SELECT COALESCE(SUM(vp.cantidad), 0) / 30.0 AS cat_avg_daily
          FROM VentasProductos vp
          JOIN Ventas v ON vp.id_venta = v.id_venta
          JOIN Productos p ON vp.id_producto = p.id_producto
          WHERE p.id_tienda = ? AND p.categoria = ? 
          AND v.fecha_salida >= CURRENT_DATE - INTERVAL '30 days'
        `, [tiendaId, categoria]);

        if (catSales.length > 0 && catSales[0].cat_avg_daily > 0) {
          const catCount = await db.getAsync(`SELECT COUNT(*) as count FROM Productos WHERE id_tienda = ? AND categoria = ?`, [tiendaId, categoria]);
          const numProducts = (catCount && catCount.count > 0) ? catCount.count : 1;
          avgDailySales = parseFloat(catSales[0].cat_avg_daily) / numProducts;
        }
      }

      // Si aún no hay historial (ni propio ni de categoría), devolver valores por defecto
      if (!avgDailySales || avgDailySales <= 0) {
        return res.json({
          success: true,
          suggestions: {
            stock_minimo: 5,
            stock_seguridad: 2,
            lead_time: suggestedLeadTime,
            nota: 'Sin historial de ventas suficiente. Se sugieren valores base predeterminados.'
          }
        });
      }

      // 3. Lead Time para producto nuevo: Promedio del proveedor
      if (!id_producto && id_proveedor) {
         const provProd = await db.getAsync(`
           SELECT AVG(lead_time) as avg_lead 
           FROM Productos 
           WHERE id_tienda = ? AND id_proveedor = ? AND lead_time > 0
         `, [tiendaId, id_proveedor]);
         
         if (provProd && provProd.avg_lead) {
           suggestedLeadTime = Math.ceil(provProd.avg_lead);
         }
      }

      // 4. Matemáticas (Reorder Point)
      // Stock Emergencia = Colchón de 2 días de venta
      // Stock Mínimo = (Ventas Diarias * Días de Entrega) + Stock Emergencia
      let stockSeguridad = Math.ceil(avgDailySales * 2); 
      let stockMinimo = Math.ceil((avgDailySales * suggestedLeadTime) + stockSeguridad);

      // Asegurar que no sugiera valores irrisorios
      if (stockMinimo < 5) stockMinimo = 5;
      if (stockSeguridad < 2) stockSeguridad = 2;

      res.json({
        success: true,
        suggestions: {
          stock_minimo: stockMinimo,
          stock_seguridad: stockSeguridad,
          lead_time: suggestedLeadTime,
          nota: id_producto ? 'Sugerencia basada en las ventas reales de los últimos 30 días.' : 'Sugerencia basada en el promedio de ventas de la categoría.'
        }
      });
    } catch (e) {
      console.error('❌ ERROR EN SUGGEST_ALERTS:', e);
      res.status(500).json({ error: safeError(e, 'Error calculando sugerencias de stock') });
    }
  },

  /**
   * Evalúa el riesgo crediticio de un cliente basado en su historial de fiados y abonos.
   * Utiliza OpenAI para perfilar al cliente.
   * GET /api/ia/assess-risk/:id_cliente
   */
  assessClientRisk: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      if (!tiendaId) return res.status(401).json({ error: "Sesión inválida" });
      const { id_cliente } = req.params;

      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('tuLlaveSecreta')) {
        return res.status(500).json({ error: "La API Key de OpenAI no está configurada correctamente en el archivo .env." });
      }

      // Obtener datos del cliente, ventas fiadas y abonos
      const clienteRes = await db.getAsync('SELECT * FROM Clientes WHERE id_cliente = ? AND id_tienda = ?', [id_cliente, tiendaId]);
      if (!clienteRes) return res.status(404).json({ error: "Cliente no encontrado" });

      const ventasFiadas = await db.allAsync('SELECT id_venta, fecha_salida, precio_total, estado_deuda FROM Ventas WHERE id_cliente = ? AND metodo_pago = ? ORDER BY fecha_salida DESC', [id_cliente, 'Fiado']);
      const abonos = await db.allAsync('SELECT id_abono, fecha_abono, monto, metodo_pago FROM Abonos WHERE id_cliente = ? ORDER BY fecha_abono DESC', [id_cliente]);

      const total_fiado = ventasFiadas.reduce((sum, v) => sum + Number(v.precio_total), 0);
      const total_abonado = abonos.reduce((sum, a) => sum + Number(a.monto), 0);
      const saldo_pendiente = total_fiado - total_abonado;

      const historialAnalisis = {
        cliente: clienteRes.nombre,
        limite_credito: clienteRes.limite_credito,
        total_compras_fiadas: total_fiado,
        total_pagado: total_abonado,
        saldo_pendiente_actual: saldo_pendiente,
        num_compras_fiadas: ventasFiadas.length,
        num_abonos: abonos.length,
        fechas_compras: ventasFiadas.map(v => v.fecha_salida),
        fechas_abonos: abonos.map(a => a.fecha_abono)
      };

      const systemPrompt = `Eres el 'Motor de Inteligencia de Negocios' de StockPilot. Tu tarea es analizar el historial de créditos (fiados) y abonos de un cliente de una tienda de barrio.
Tus respuestas deben estar en formato JSON con la siguiente estructura:
{
  "perfil": "Buen Pagador" | "Regular" | "Mal Pagador" | "Cliente Nuevo",
  "riesgo": "Bajo" | "Medio" | "Alto" | "Evaluando",
  "razon": "Explicación de 1 a 2 oraciones de por qué se asignó este perfil, basándose en su frecuencia de pago y saldo acumulado. ATENCIÓN: Si el cliente tiene 1 o 2 compras fiadas muy recientes y aún no ha abonado, clasifícalo como 'Cliente Nuevo' y riesgo 'Evaluando', NO como 'Mal Pagador'.",
  "sugerencia": "Ej: Limitar crédito, ofrecer descuentos por pronto pago, etc."
}`;
      const userPrompt = `Analiza este historial crediticio y determina el riesgo:\n${JSON.stringify(historialAnalisis, null, 2)}`;

      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const aiData = JSON.parse(gptResponse.choices[0].message.content);

      // Guardar en auditoría IA
      await db.runAsync(
        `INSERT INTO Auditoria_IA (id_tienda, motor_ia, prompt_utilizado, datos_base_json, sugerencia_ia_json, impacto_decision, razon_ia)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          tiendaId, 
          'Evaluador Riesgo Fiados v1.0', 
          userPrompt, 
          JSON.stringify(historialAnalisis), 
          JSON.stringify(aiData), 
          `Perfil: ${aiData.perfil}, Riesgo: ${aiData.riesgo}`, 
          aiData.razon
        ]
      );
      
      // Log legado
      logToAuditFile(tiendaId, null, `Evaluación de riesgo cliente ${clienteRes.nombre}`, `Riesgo: ${aiData.riesgo}`);

      res.json({ success: true, analisis: aiData });
    } catch (e) {
      console.error('❌ ERROR EN ASSESS_CLIENT_RISK:', e);
      res.status(500).json({ error: safeError(e, 'Error evaluando riesgo del cliente con IA') });
    }
  }
};

module.exports = aiController;
