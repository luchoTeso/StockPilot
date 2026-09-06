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
  } catch (_) {}
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
  } catch (_) {}
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

      // 1. Obtener datos crudos con SQL optimizado (CTE en lugar de subconsultas correlacionadas)
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
        )
        SELECT 
          p.id_producto as id, 
          p.nombre_producto as nombre, 
          p.cantidad as stock_actual, 
          p.precio, 
          p.categoria, 
          p.stock_seguridad, 
          p.lead_time,
          COALESCE(vr.qty_7d, 0) / 7.0 as velocity_7d,
          COALESCE(vr.qty_30d, 0) / 30.0 as velocity_30d,
          COALESCE(vr.qty_60d, 0) / 60.0 as velocity_60d,
          COALESCE(vr.qty_90d, 0) / 90.0 as velocity_90d,
          pia.avg_precision
        FROM Productos p
        LEFT JOIN VentasRecientes vr ON p.id_producto = vr.id_producto
        LEFT JOIN PrecisionIA pia ON p.id_producto = pia.id_producto
        WHERE p.id_tienda = ? AND p.estado = 'Disponible'
      `;
      // Pasamos dos veces el tiendaId: uno para VentasRecientes y otro para Productos
      const rows = await db.allAsync(snapshotQuery, [tiendaId, tiendaId]);
      
      // 2. Cálculo de Hash para Caché Inteligente
      const dataString = JSON.stringify(rows);
      const currentHash = crypto.createHash('md5').update(dataString).digest('hex');

      // 1. Memoria (instantáneo)
      const tiendaCache = aiCache_v3[tiendaId];
      if (tiendaCache && tiendaCache.dataHash === currentHash) {
        return res.json({ cached: true, recommendations: tiendaCache.recommendations });
      }
      // 2. BD (sobrevive reinicios de Railway — evita llamada a OpenAI si los datos no cambiaron)
      const dbCached = await dbCacheGet(`RECS_${tiendaId}`, currentHash);
      if (dbCached) {
        aiCache_v3[tiendaId] = { dataHash: currentHash, recommendations: dbCached, timestamp: new Date() };
        return res.json({ cached: true, recommendations: dbCached });
      }

      console.log('--- AUDITOR: DETECTADO CAMBIO EN INVENTARIO. RECALCULANDO IA ---');

      // 3. Procesamiento Analítico (Tendencia y Variabilidad)
      let totalRevenue = 0;
        const processed = rows.map(r => {
          const v30 = Number(r.velocity_30d || 0);
          const v7 = Number(r.velocity_7d || 0);
          const rev = v30 * 30 * r.precio;
          totalRevenue += rev;
          // Tendencia: >1.2 alcista, <0.8 bajista
          const trend = v30 > 0.01 ? (v7 / v30) : 1;
          return { ...r, velocity_30d: v30, velocity_7d: v7, revenue: rev, trend: parseFloat(Number(trend).toFixed(2)) };
        });

      processed.sort((a, b) => b.revenue - a.revenue);
      let cum = 0;
      const contextItemsFull = processed.map(item => {
        cum += item.revenue;
        const p = (cum / (totalRevenue || 1)) * 100;
        const category = p <= 80 ? 'A' : (p <= 95 ? 'B' : 'C');
        const rop = (item.velocity_30d * item.lead_time) + item.stock_seguridad;
        
          return {
            id: item.id,
            nombre: item.nombre,
            stock: item.stock_actual,
            base_load: Math.ceil(rop),
            abc: category,
            trend_val: item.trend,
            trend_label: item.trend > 1.2 ? 'alcista' : (item.trend < 0.8 ? 'bajista' : 'estable'),
            velocity_long: { 
                d60: parseFloat(Number(item.velocity_60d || 0).toFixed(2)), 
                d90: parseFloat(Number(item.velocity_90d || 0).toFixed(2)) 
            },
            risk: item.stock_actual <= item.stock_seguridad ? 'CRÍTICO' : (item.stock_actual <= rop ? 'MEDIO' : 'BAJO'),
            avg_precision: item.avg_precision // Pasamos la precisión promedio para usarla luego
          };
      });

      const contextItemsForAI = contextItemsFull.slice(0, 15);

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
            content: `Analiza y ajusta estos ítems críticos: ${JSON.stringify(contextItemsForAI.slice(0, 8))}` 
          }
        ],
        response_format: { type: "json_object" }
      });

      // 5. Normalización y Guardrails Dinámicos
      let aiResponse;
      try {
        aiResponse = JSON.parse(completion.choices[0].message.content);
      } catch (e) {
        throw new Error("Fallo en parsing IA");
      }

      const rawAdjustments = Array.isArray(aiResponse.adjustments) ? aiResponse.adjustments : [];
      const finalRecommendations = rawAdjustments.map(adj => {
        const original = contextItemsFull.find(i => i.id === adj.id);
        if (!original) return null;

        // Extraer número del ajuste
        const adjNum = parseInt(adj.adjustment.replace(/[^0-9-]/g, '')) || 0;
        
        // Guardrails Dinámicos (Clamping)
        let limit = original.abc === 'A' ? 100 : (original.abc === 'B' ? 50 : 20);
        const clampedAdj = Math.min(Math.max(adjNum, -50), limit);

        const finalTotal = Math.ceil(original.base_load * (1 + clampedAdj/100));
        
        const result = {
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
      }).filter(r => r !== null);

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
      dbCacheSet(`RECS_${tiendaId}`, currentHash, finalRecommendations);

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
        SELECT 
          p.id_producto, 
          p.nombre_producto,
          p.cantidad as stock_actual,
          p.precio,
          p.id_proveedor,
          p.categoria,
          p.stock_seguridad,
          p.lead_time,
          COALESCE(
            (SELECT SUM(vp2.cantidad) 
             FROM VentasProductos vp2 
             JOIN Ventas v2 ON vp2.id_venta = v2.id_venta 
             WHERE vp2.id_producto = p.id_producto
            ), 0) / 30.0 as velocidad_venta
        FROM Productos p
        WHERE p.id_tienda = ? AND p.estado = 'Disponible'
      `;

      const rows = await db.allAsync(query, [tiendaId]);
      let totalRevenue = 0;
      const base = rows.map(r => {
        const vel = Number(r.velocidad_venta || 0);
        const rev = vel * 30 * r.precio;
        totalRevenue += rev;
        return { ...r, velocidad_venta: vel, revenue: rev, days_to_exhaust: vel > 0 ? Math.round(r.stock_actual / vel) : Infinity };
      });

      base.sort((a, b) => b.revenue - a.revenue);
      
      let cum = 0;
      const finalData = base.map(item => {
        cum += item.revenue;
        const p = (cum / (totalRevenue || 1)) * 100;
        const category = p <= 80 ? 'A' : (p <= 95 ? 'B' : 'C');
        
        let risk = 'low';
        let ROP = (item.velocidad_venta * item.lead_time) + item.stock_seguridad;

        if (category === 'A' && item.days_to_exhaust <= 5) {
          risk = 'high';
        } else if (category === 'A' || item.stock_actual <= ROP) {
          risk = 'medium';
        }

        return { 
          id_producto: item.id_producto,
          id_proveedor: item.id_proveedor,
          nombre: item.nombre_producto,
          category, 
          risk, 
          precio: item.precio,
          velocity: item.velocidad_venta,
          stock_actual: item.stock_actual,
          stock_seguridad: item.stock_seguridad,
          days_to_exhaust: item.days_to_exhaust,
          revenue: Math.round(item.revenue),
          rop: Math.ceil(ROP)
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

      // 3. Hash para Caché (Independiente de recomendaciones de compra)
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

      // 4. Prompt de Estrategia Comercial
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `Eres un Experto en Retail y Estrategia de Ventas. Analizarás productos estancados o en riesgo de pérdida.
            Tu misión es proponer estrategias COMERCIALES (no logísticas).
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
  }
};

module.exports = aiController;
