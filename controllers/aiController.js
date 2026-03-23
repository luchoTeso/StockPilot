const db = require('../config/database');
const { OpenAI } = require('openai');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Registro de Auditoría (Audit Trail)
const AUDIT_LOG_PATH = path.join(__dirname, '..', 'ai_audit.log');

// Caché avanzada v3 (Basada en Hash)
let aiCache_v3 = {
  dataHash: null,
  recommendations: null,
  timestamp: null
};

/**
 * AI Controller
 * Maneja la lógica analítica y la integración con OpenAI
 */
const aiController = {
  /**
   * Obtiene la analítica y genera recomendaciones de IA (Caché activo)
   */
  getDashboardRecommendations: async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('tuLlaveSecreta')) {
        return res.status(500).json({ error: "La API Key de OpenAI no está configurada correctamente en el archivo .env." });
      }

      const tiendaId = req.session.tiendaId || 6;

      // 1. Obtener datos crudos para Hash y Análisis
      const snapshotQuery = `
        SELECT 
          p.id_producto as id, p.nombre_producto as nombre, p.cantidad as stock_actual, p.precio, p.categoria, p.stock_seguridad, p.lead_time,
          IFNULL((SELECT SUM(vp.cantidad) FROM VentasProductos vp JOIN Ventas v ON vp.id_venta = v.id_venta WHERE vp.id_producto = p.id_producto AND v.fecha_salida >= DATE('now', '-30 days')), 0) / 30.0 as velocity_30d,
          IFNULL((SELECT SUM(vp.cantidad) FROM VentasProductos vp JOIN Ventas v ON vp.id_venta = v.id_venta WHERE vp.id_producto = p.id_producto AND v.fecha_salida >= DATE('now', '-7 days')), 0) / 7.0 as velocity_7d
        FROM Productos p
        WHERE p.id_tienda = ? AND p.estado = 'Disponible'
      `;
      const rows = await db.allAsync(snapshotQuery, [tiendaId]);
      
      // 2. Cálculo de Hash para Caché Inteligente
      const dataString = JSON.stringify(rows);
      const currentHash = crypto.createHash('md5').update(dataString).digest('hex');

      if (aiCache_v3.dataHash === currentHash) {
        console.log('--- AUDITOR: DATOS SIN CAMBIOS SIGNIFICATIVOS. SIRVIENDO CACHÉ V3 ---');
        return res.json({ cached: true, recommendations: aiCache_v3.recommendations });
      }

      console.log('--- AUDITOR: DETECTADO CAMBIO EN INVENTARIO. RECALCULANDO IA ---');

      // 3. Procesamiento Analítico (Tendencia y Variabilidad)
      let totalRevenue = 0;
      const processed = rows.map(r => {
        const rev = (r.velocity_30d || 0) * 30 * r.precio;
        totalRevenue += rev;
        // Tendencia: >1.2 alcista, <0.8 bajista
        const trend = r.velocity_30d > 0.01 ? (r.velocity_7d / r.velocity_30d) : 1;
        return { ...r, revenue: rev, trend: parseFloat(trend.toFixed(2)) };
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
          risk: item.stock_actual <= item.stock_seguridad ? 'CRÍTICO' : (item.stock_actual <= rop ? 'MEDIO' : 'BAJO')
        };
      });

      const contextItemsForAI = contextItemsFull.slice(0, 15);

      // 4. Llamada a OpenAI (Contexto Estructurado)
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `Eres un Auditor Estratégico MBI (Micro-Business Intelligence) especializado en tiendas de barrio. Se te dará un JSON de inventario.
            Propondrás un AJUSTE porcentual (ej: "+20%", "-10%", "0%") sobre la 'base_load' (cantidad sugerida por la matemática ROP).
            Límites Dinámicos: Clase A (alta rotación: max +100%), Clase B (media: max +50%), Clase C (baja rotación: max +20%).
            Responde ÚNICAMENTE con JSON: { "adjustments": [ { "id": ID, "adjustment": "+20%", "reason": "..." } ] }
            REGLA CRÍTICA PARA 'reason': Escribe una justificación incisiva, analítica y sin rodeos (20-35 palabras). NO uses texto genérico. Relaciona la agresividad del ajuste con el nivel de riesgo de quiebre (CRÍTICO/MEDIO) contra su tendencia de ventas. Piensa y habla como un gerente logístico cuidando el capital.` 
          },
          { 
            role: "user", 
            content: `Analiza y ajusta estos ítems críticos: ${JSON.stringify(contextItemsForAI.slice(0, 5))}` 
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
          confidence: 90,
          trend: original.trend_label
        };

        // Decision Log (Audit Trail) → BD en vez de archivo
        return result;
      }).filter(r => r !== null);

      if (finalRecommendations.length === 0) {
        throw new Error("No se generaron recomendaciones válidas");
      }

      // Auditoría en BD (reemplaza ai_audit.log)
      try {
        const tiendaId = req.session.tiendaId;
        const datos_base = JSON.stringify(finalRecommendations.map(r => ({ product: r.product, base: r.base })));
        const sugerencia_json = JSON.stringify(finalRecommendations.map(r => ({ product: r.product, adjustment: r.adjustment, final: r.final, reason: r.reason })));
        await db.runAsync(
          'INSERT INTO Auditoria_IA (id_tienda, id_orden, prompt_utilizado, datos_base_json, sugerencia_ia_json, impacto_decision, razon_ia) VALUES (?, NULL, ?, ?, ?, ?, ?)',
          [tiendaId, 'Dashboard Auditor MBI v2.4', datos_base, sugerencia_json, 'Recomendaciones Dashboard', 'Análisis proactivo de inventario']
        );
      } catch (auditErr) {
        console.error('⚠️ Error guardando auditoría (no crítico):', auditErr.message);
      }

      // 6. Actualizar Caché v3
      aiCache_v3 = { dataHash: currentHash, recommendations: finalRecommendations, timestamp: new Date() };

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
   * Endpoint original de matemáticas puras (Snapshot)
   */
  getAnalyticalSnapshot: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId || 6;
      const getSnapshot = () => new Promise((resolve, reject) => {
        const query = `
          SELECT 
            p.id_producto, 
            p.nombre_producto,
            p.cantidad as stock_actual,
            p.precio,
            p.categoria,
            p.stock_seguridad,
            p.lead_time,
            IFNULL(
              (SELECT SUM(vp2.cantidad) 
               FROM VentasProductos vp2 
               JOIN Ventas v2 ON vp2.id_venta = v2.id_venta 
               WHERE vp2.id_producto = p.id_producto
              ), 0) / 30.0 as velocidad_venta
          FROM Productos p
          WHERE p.id_tienda = ? AND p.estado = 'Disponible'
        `;
        db.all(query, [tiendaId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      const rows = await getSnapshot();
      let totalRevenue = 0;
      const base = rows.map(r => {
        const rev = r.velocidad_venta * 30 * r.precio;
        totalRevenue += rev;
        return { ...r, revenue: rev, days_to_exhaust: r.velocidad_venta > 0 ? Math.round(r.stock_actual / r.velocidad_venta) : Infinity };
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
          nombre: item.nombre_producto,
          category, 
          risk, 
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
      res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Obtiene las alertas profesionales basadas en reglas duras (ROP)
   */
  getProAlerts: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId || 5;
      const Product = require('../models/Product');
      const alerts = await Product.findProAlerts(tiendaId);
      
      res.json({ success: true, alerts });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};

module.exports = aiController;
