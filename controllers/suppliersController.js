const db = require('../config/database');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const suppliersController = {
  // Obtener todos los proveedores de la tienda
  getAll: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId || 6;
      const query = `
        SELECT p.*, 
               (SELECT COUNT(id_producto) FROM Productos WHERE id_proveedor = p.id_proveedor AND estado='Disponible') as productos_vinculados
        FROM Proveedores p
        WHERE p.id_tienda = ? AND p.estado = 'Activo'
        ORDER BY p.nombre_empresa ASC
      `;
      const rows = await db.allAsync(query, [tiendaId]);
      res.json({ success: true, data: rows });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  },

  // Crear un proveedor
  create: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId || 6;
      const { nombre_empresa, contacto_principal, email, telefono, direccion } = req.body;
      
      const query = `
        INSERT INTO Proveedores (id_tienda, nombre_empresa, contacto_principal, email, telefono, direccion)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const st = await new Promise((resolve, reject) => {
          db.run(query, [tiendaId, nombre_empresa, contacto_principal, email, telefono, direccion], function(err) {
              if (err) reject(err);
              else resolve(this);
          });
      });
      
      res.json({ success: true, message: 'Proveedor creado', id: st.lastID });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  },

  // Obtener el Forecast Matemático (Sin IA) agrupado por Proveedor
  getSupplierForecast: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId || 6;
      const { proveedorId } = req.params;

      const query = `
        SELECT 
          p.id_producto, p.nombre_producto, p.cantidad as stock_actual, p.precio, p.stock_seguridad, p.lead_time,
          IFNULL(
            (SELECT SUM(vp.cantidad) FROM VentasProductos vp JOIN Ventas v ON vp.id_venta = v.id_venta 
             WHERE vp.id_producto = p.id_producto AND v.fecha_salida >= DATE('now', '-30 days')
            ), 0) / 30.0 as velocity_30d,
          IFNULL(
            (SELECT AVG(factor_precision) FROM (
              SELECT factor_precision FROM Feedback_IA f 
              WHERE f.id_producto = p.id_producto 
              ORDER BY fecha_evaluacion DESC LIMIT 5
            )), 1.0) as factor_ia
        FROM Productos p
        WHERE p.id_tienda = ? AND p.id_proveedor = ? AND p.estado = 'Disponible'
      `;

      const rows = await db.allAsync(query, [tiendaId, proveedorId]);
      
      let totalRevenue = 0;
      const productsWithMath = rows.map(r => {
        const rev = r.velocity_30d * 30 * r.precio;
        totalRevenue += rev;
        // Módulo 14: Ajuste inteligente con Factor de Precisión IA
        // Multiplicamos la demanda proyectada por el factor histórico de la IA (EMA de los últimos 5).
        const rop_base = (r.velocity_30d * r.lead_time) + r.stock_seguridad;
        const rop = Math.ceil(rop_base * r.factor_ia);
        const days = r.velocity_30d > 0.01 ? Math.round(r.stock_actual / r.velocity_30d) : Infinity;
        
        return { ...r, revenue: rev, rop, days_to_exhaust: days };
      });

      productsWithMath.sort((a, b) => b.revenue - a.revenue);
      
      let cum = 0;
      const smartList = productsWithMath.map(item => {
        cum += item.revenue;
        const p = (cum / (totalRevenue || 1)) * 100;
        const category = p <= 80 ? 'A' : (p <= 95 ? 'B' : 'C');
        
        let risk = 'low';
        if (item.stock_actual <= item.stock_seguridad) risk = 'critical';
        else if (item.stock_actual <= item.rop) risk = 'medium';

        return {
          id_producto: item.id_producto,
          nombre: item.nombre_producto,
          clasificacion_abc: category,
          nivel_riesgo: risk,
          stock: item.stock_actual,
          dias_inventario: item.days_to_exhaust,
          factor_aprendizaje_ia: item.factor_ia.toFixed(2), // Módulo 14
          cantidad_sugerida: risk !== 'low' ? Math.max(0, item.rop - item.stock_actual) : 0,
          presupuesto_estimado: risk !== 'low' ? Math.max(0, item.rop - item.stock_actual) * item.precio : 0
        };
      });

      // Filtrar los que sugieren recompra para este proveedor específicamente
      const replenishmentList = smartList.filter(item => item.cantidad_sugerida > 0);

      res.json({ 
          success: true, 
          proveedor_id: proveedorId, 
          recomendaciones_matematicas: replenishmentList,
          total_presupuesto_base: replenishmentList.reduce((acc, curr) => acc + curr.presupuesto_estimado, 0)
      });

    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  },

  // FASE 3 y 4: Generar Orden Inteligente (Riesgo + IA Copiloto)
  generateSmartOrder: async (req, res) => {
    try {
      const { proveedorId } = req.params;
      const { recomendaciones_matematicas, presupuesto_maximo } = req.body; // Viene de la Fase 1
      
      if (!recomendaciones_matematicas || recomendaciones_matematicas.length === 0) {
        return res.status(400).json({ success: false, error: 'No hay productos para analizar.' });
      }

      // FASE 3: Sistema de Riesgos (Métrica de Riesgo)
      const totalCost = recomendaciones_matematicas.reduce((acc, curr) => acc + curr.presupuesto_estimado, 0);
      const itemsCriticos = recomendaciones_matematicas.filter(r => r.nivel_riesgo === 'critical').length;
      
      let riskLevel = 'Bajo'; // Automático
      let riskReason = 'Presupuesto holgado y riesgos de stock controlables.';
      
      const budgetLimit = presupuesto_maximo || 1000000; // Presupuesto default si el usuario no manda uno

      if (totalCost > budgetLimit) {
        riskLevel = 'Alto';
        riskReason = 'El costo total excede el presupuesto máximo establecido.';
      } else if (itemsCriticos > 0) {
        riskLevel = 'Medio';
        riskReason = `Existen ${itemsCriticos} productos en estado crítico de agotamiento.`;
      }

      // FASE 4: Integración IA (Copiloto)
      console.log('--- AUDITOR: CONSULTANDO IA PARA PROVEEDOR ' + proveedorId + ' ---');
      
      const promptData = recomendaciones_matematicas.map(r => ({
        id: r.id_producto,
        producto: r.nombre,
        abc: r.clasificacion_abc,
        sugerencia_matematica: r.cantidad_sugerida
      }));

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "Eres el Copiloto Experto Comercial para un dueño de Pyme. Vas a revisar un carrito de compras y la 'sugerencia_matematica' de pedido. " +
                     "Aplica tu instinto de negocio para devolver un AJUSTE porcentual de esa sugerencia (para sumar o restar al pedido base). " +
                     "Límites seguros: Clase A (max +100%), Clase B (max +50%), Clase C (max +20%). " +
                     "Responde en JSON: { \"ajustes\": [ { \"id\": ID_PRODUCTO, \"porcentaje\": \"+15%\", \"razon\": \"...\" } ] }. " +
                     "REGLA CRÍTICA PARA 'razon': Habla como un asesor cercano, empático y MUY simple. CERO lenguaje técnico (prohíbido usar 'Clase A', 'tendencia algorítmica', 'análisis MBI', 'ROP' o 'stock seguridad'). Usa entre 15 y 30 palabras. Ejemplo: 'Recomiendo asegurar un extra de unidades. Es mejor estar cubiertos con este proveedor para no dejar ganancias sobre la mesa.'"
          },
          { 
            role: "user", 
            content: 'Analiza este carrito de proveedor: ' + JSON.stringify(promptData)
          }
        ],
        response_format: { type: "json_object" }
      });

      let iaResponse;
      try {
        iaResponse = JSON.parse(completion.choices[0].message.content);
      } catch (e) {
        throw new Error("El oráculo IA respondió un JSON inválido.");
      }

      const adjustments = iaResponse.ajustes || [];

      // FASE 5: Fusionando Matemáticas con IA
      const finalCart = recomendaciones_matematicas.map(item => {
        const aiMemory = adjustments.find(a => a.id === item.id_producto);
        const adjNum = aiMemory ? parseInt(aiMemory.porcentaje.replace(/[^0-9-]/g, '')) || 0 : 0;
        
        let limit = item.clasificacion_abc === 'A' ? 100 : (item.clasificacion_abc === 'B' ? 50 : 20);
        const clampedAdj = Math.min(Math.max(adjNum, -50), limit);
        
        const finalQty = Math.ceil(item.cantidad_sugerida * (1 + clampedAdj / 100));

        return {
          id_producto: item.id_producto,
          nombre: item.nombre,
          clasificacion_abc: item.clasificacion_abc,
          nivel_riesgo: item.nivel_riesgo,
          stock_actual: item.stock,
          calculo_base: item.cantidad_sugerida,
          ajuste_ia: clampedAdj > 0 ? ('+' + clampedAdj + '%') : (clampedAdj + '%'),
          sugerencia_final: finalQty,
          razon_ia: aiMemory ? aiMemory.razon : 'Sin ajuste inteligente aplicable.',
          presupuesto_estimado_final: Math.round(finalQty * (item.presupuesto_estimado / item.cantidad_sugerida || 0))
        };
      });

      const nuevoTotal = finalCart.reduce((acc, curr) => acc + curr.presupuesto_estimado_final, 0);

      res.json({
        success: true,
        evaluacion_riesgo: {
          nivel: riskLevel,
          justificacion: riskReason,
          costo_total_estimado: nuevoTotal
        },
        carrito_inteligente: finalCart
      });

    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  },

  // FASES 5 y 6: Registrar la Orden de forma Permanente en SQLite (Trazabilidad)
  submitSmartOrder: async (req, res) => {
    try {
      const { proveedorId } = req.params;
      const tiendaId = req.session.tiendaId || 6;
      const userId = req.session.userId || 1;
      const { 
        carrito_final, 
        evaluacion_riesgo, 
        estado_deseado, // 'Aprobada' si el humano dijo Sí, o 'Pendiente'
        notas_humanas 
      } = req.body;

      if (!carrito_final || carrito_final.length === 0) {
        return res.status(400).json({ success: false, error: 'El carrito está vacío.' });
      }

      // 1. Crear la Orden de Compra Padre
      const insertOrdenQuery = "INSERT INTO Ordenes_Compra (id_tienda, id_proveedor, id_usuario, estado, riesgo, presupuesto_total, notas) VALUES (?, ?, ?, ?, ?, ?, ?)";

      const ordenResult = await new Promise((resolve, reject) => {
        db.run(insertOrdenQuery, [
          tiendaId, proveedorId, userId, 
          estado_deseado || 'Borrador',
          evaluacion_riesgo.nivel,
          evaluacion_riesgo.costo_total_estimado,
          notas_humanas || 'Sin notas.'
        ], function(err) {
            if (err) reject(err);
            else resolve(this);
        });
      });

      const ordenId = ordenResult.lastID;

      // 2. Insertar Detalles de los items
      const insertDetalleQuery = "INSERT INTO Ordenes_Detalle (id_orden, id_producto, cantidad_base, sugerencia_ia, cantidad_final, costo_unitario) VALUES (?, ?, ?, ?, ?, ?)";

      for (const item of carrito_final) {
        await new Promise((resolve, reject) => {
          // Extraer número de sugerencia_ia (ej. "+15%" -> 15)
          const iaPorcentaje = item.ajuste_ia ? parseInt(item.ajuste_ia.replace(/[^0-9-]/g, '')) : 0;
          const costoUnit = item.presupuesto_estimado_final / item.sugerencia_final || 0;
          
          db.run(insertDetalleQuery, [
            ordenId, item.id_producto, item.calculo_base, iaPorcentaje, item.sugerencia_final, costoUnit
          ], function(err) {
            if (err) reject(err); else resolve(this);
          });
        });
      }

      // 3. Escribir Auditoría Fuerte (FASE 6)
      const insertAuditQuery = "INSERT INTO Auditoria_IA (id_tienda, id_orden, prompt_utilizado, datos_base_json, sugerencia_ia_json, impacto_decision, razon_ia) VALUES (?, ?, ?, ?, ?, ?, ?)";

      await new Promise((resolve, reject) => {
        const datos_base = JSON.stringify(carrito_final.map(i => ({ 
            product: i.nombre, 
            base: i.calculo_base 
        })));
        
        const ajuste_crudo = JSON.stringify(carrito_final.map(i => ({ 
            product: i.nombre,
            adjustment: i.ajuste_ia, 
            final: i.sugerencia_final,
            reason: i.razon_ia 
        })));
        
        db.run(insertAuditQuery, [
          tiendaId, ordenId, 
          "Copiloto Suministrador Pro v2", 
          datos_base, 
          ajuste_crudo, 
          "Impacto Múltiple", 
          "Consolidación Inteligente de Multiples Items"
        ], function(err) {
          if (err) reject(err); else resolve(this);
        });
      });

      res.json({ success: true, message: 'Orden Inteligente creada y Auditada bajo código.', orden_id: ordenId });

    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  },

  // Obtener Historial de Órdenes
  getOrdersHistory: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId || 6;
      const query = `
        SELECT o.*, p.nombre_empresa as proveedor_nombre, u.nombres as usuario_nombre,
               (SELECT COUNT(*) FROM Ordenes_Detalle WHERE id_orden = o.id_orden) as items_count
        FROM Ordenes_Compra o
        JOIN Proveedores p ON o.id_proveedor = p.id_proveedor
        JOIN Usuarios u ON o.id_usuario = u.id_usuario
        WHERE o.id_tienda = ?
        ORDER BY o.fecha_creacion DESC
      `;
      const rows = await db.allAsync(query, [tiendaId]);
      res.json({ success: true, data: rows });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  },

  // Obtener Detalle de una Orden específica
  getOrderDetail: async (req, res) => {
    try {
      const { ordenId } = req.params;
      const query = `
        SELECT d.*, p.nombre_producto
        FROM Ordenes_Detalle d
        JOIN Productos p ON d.id_producto = p.id_producto
        WHERE d.id_orden = ?
      `;
      const rows = await db.allAsync(query, [ordenId]);
      res.json({ success: true, data: rows });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  },

  // Actualizar estado de una orden (Aprobar / Rechazar)
  updateOrderStatus: async (req, res) => {
    try {
      const { ordenId } = req.params;
      const tiendaId = req.session.tiendaId || 6;
      const { estado, notas } = req.body;

      const estadosPermitidos = ['Aprobada', 'Rechazada'];
      if (!estadosPermitidos.includes(estado)) {
        return res.status(400).json({ success: false, error: 'Estado no válido. Use: Aprobada o Rechazada.' });
      }

      // Verificar que la orden existe y pertenece a la tienda
      const orden = await db.getAsync(
        'SELECT * FROM Ordenes_Compra WHERE id_orden = ? AND id_tienda = ?',
        [ordenId, tiendaId]
      );

      if (!orden) {
        return res.status(404).json({ success: false, error: 'Orden no encontrada.' });
      }

      if (orden.estado !== 'Pendiente' && orden.estado !== 'Borrador') {
        return res.status(400).json({ success: false, error: `No se puede modificar una orden en estado "${orden.estado}".` });
      }

      await db.runAsync(
        'UPDATE Ordenes_Compra SET estado = ?, notas = COALESCE(?, notas) WHERE id_orden = ?',
        [estado, notas || null, ordenId]
      );

      res.json({ success: true, message: `Orden #${ordenId} actualizada a "${estado}".` });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  }
};

module.exports = suppliersController;
