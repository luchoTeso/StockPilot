const db = require('../config/database');
const { OpenAI } = require('openai');
const transporter = require('../config/mailer');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const suppliersController = {
  // Obtener todos los proveedores de la tienda
  getAll: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      const query = `
        SELECT p.*, 
               (SELECT COUNT(id_producto) FROM Productos WHERE id_proveedor = p.id_proveedor AND estado='Disponible') as productos_vinculados,
               (SELECT SUM(presupuesto_total - monto_pagado) FROM Ordenes_Compra WHERE id_proveedor = p.id_proveedor) as total_deuda
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
      const tiendaId = req.session.tiendaId;
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

  // Actualizar un proveedor
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const tiendaId = req.session.tiendaId;
      const { nombre_empresa, contacto_principal, email, telefono, direccion } = req.body;
      
      const query = `
        UPDATE Proveedores 
        SET nombre_empresa = ?, contacto_principal = ?, email = ?, telefono = ?, direccion = ?
        WHERE id_proveedor = ? AND id_tienda = ?
      `;
      
      await db.runAsync(query, [nombre_empresa, contacto_principal, email, telefono, direccion, id, tiendaId]);
      res.json({ success: true, message: 'Proveedor actualizado' });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  },

  // Borrado lógico de un proveedor
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const tiendaId = req.session.tiendaId;
      
      // Borrado lógico por seguridad y trazabilidad
      const query = `UPDATE Proveedores SET estado = 'Inactivo' WHERE id_proveedor = ? AND id_tienda = ?`;
      
      await db.runAsync(query, [id, tiendaId]);
      res.json({ success: true, message: 'Proveedor eliminado del sistema' });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  },

  // Obtener el Forecast Matemático (Sin IA) agrupado por Proveedor
  getSupplierForecast: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
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
      const tiendaId = req.session.tiendaId;
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
          if (err) reject(err); else {
            try {
              const fs = require('fs');
              const path = require('path');
              const logEntry = `[${new Date().toISOString()}] Tienda: ${tiendaId} | Orden: ${ordenId} | Razón: Consolidación Inteligente de Multiples Items | Impacto: Impacto Múltiple\n`;
              fs.appendFileSync(path.join(__dirname, '..', 'ai_audit.log'), logEntry);
            } catch (e) { console.error('Error audit log', e); }
            resolve(this);
          }
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
      const tiendaId = req.session.tiendaId;
      const query = `
        SELECT o.*, p.nombre_empresa as proveedor_nombre, u.nombres as usuario_nombre,
               (SELECT COUNT(*) FROM Ordenes_Detalle WHERE id_orden = o.id_orden) as items_count,
               (o.presupuesto_total - o.monto_pagado) as saldo_pendiente
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
      const tiendaId = req.session.tiendaId;
      const { estado, notas } = req.body;

      const estadosPermitidos = ['Aprobada', 'Rechazada', 'Enviada'];
      if (!estadosPermitidos.includes(estado)) {
        return res.status(400).json({ success: false, error: 'Estado no válido. Use: Aprobada, Rechazada o Enviada.' });
      }

      const orden = await db.getAsync(
        'SELECT * FROM Ordenes_Compra WHERE id_orden = ? AND id_tienda = ?',
        [ordenId, tiendaId]
      );

      if (!orden) {
        return res.status(404).json({ success: false, error: 'Orden no encontrada.' });
      }

      if (orden.estado !== 'Pendiente' && orden.estado !== 'Borrador' && orden.estado !== 'Aprobada') {
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
  },

  // Enviar Orden de Compra al Proveedor por Email
  sendOrderToSupplier: async (req, res) => {
    try {
      const { ordenId } = req.params;
      const tiendaId = req.session.tiendaId;
      const { mensaje_personalizado } = req.body;

      // 1. Obtener datos de la orden + proveedor
      const orden = await db.getAsync(`
        SELECT o.*, p.nombre_empresa, p.contacto_principal, p.email as proveedor_email, p.telefono as proveedor_telefono,
               t.nombre_establecimiento, t.direccion as tienda_direccion, t.celular as tienda_celular
        FROM Ordenes_Compra o
        JOIN Proveedores p ON o.id_proveedor = p.id_proveedor
        JOIN Tienda t ON o.id_tienda = t.id_tienda
        WHERE o.id_orden = ? AND o.id_tienda = ?
      `, [ordenId, tiendaId]);

      if (!orden) {
        return res.status(404).json({ success: false, error: 'Orden no encontrada.' });
      }

      if (!orden.proveedor_email || orden.proveedor_email.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          error: 'Este proveedor no tiene un correo electrónico registrado. Edita sus datos y agrega un email antes de enviar.' 
        });
      }

      // 2. Obtener detalle de productos
      const items = await db.allAsync(`
        SELECT d.*, p.nombre_producto
        FROM Ordenes_Detalle d
        JOIN Productos p ON d.id_producto = p.id_producto
        WHERE d.id_orden = ?
      `, [ordenId]);

      if (items.length === 0) {
        return res.status(400).json({ success: false, error: 'La orden no tiene productos.' });
      }

      // 3. Obtener correo del admin para replyTo
      const admin = await db.getAsync(`
        SELECT correo, nombres FROM Usuarios 
        WHERE id_tienda = ? AND (rol = 'Administrador' OR rol = 'Dueño') AND correo IS NOT NULL
        LIMIT 1
      `, [tiendaId]);

      // 4. Construir la tabla HTML de productos
      const formatCOP = (num) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
      
      const fechaFormateada = new Date().toLocaleDateString('es-CO', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });

      const productRows = items.map((item, idx) => {
        const subtotal = item.cantidad_final * item.costo_unitario;
        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 12px; font-size: 13px; color: #1e293b; font-weight: 600;">${item.nombre_producto}</td>
            <td style="padding: 10px 12px; font-size: 13px; color: #334155; text-align: center; font-weight: 700;">${item.cantidad_final}</td>
            <td style="padding: 10px 12px; font-size: 13px; color: #1e293b; font-weight: 700; text-align: right;">${formatCOP(subtotal)}</td>
          </tr>
        `;
      }).join('');

      const totalGeneral = items.reduce((acc, item) => acc + (item.cantidad_final * item.costo_unitario), 0);

      // 5. Plantilla HTML del correo
      const htmlEmail = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff; width: 100%;">
          
          <!-- ENCABEZADO -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 22px; letter-spacing: -0.025em; font-weight: 800;">📋 Orden de Compra</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.85; font-size: 13px;">StockPilot — Sistema Inteligente de Inventarios</p>
          </div>

          <!-- INFO DE LA ORDEN -->
          <div style="padding: 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0;">
                  <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 700;">De:</span>
                  <span style="font-size: 13px; color: #1e293b; font-weight: 600; margin-left: 6px;">${orden.nombre_establecimiento}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 0;">
                  <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 700;">Para:</span>
                  <span style="font-size: 13px; color: #1e293b; font-weight: 600; margin-left: 6px;">${orden.nombre_empresa}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 0;">
                  <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 700;">Orden:</span>
                  <span style="font-size: 13px; color: #4f46e5; font-weight: 800; margin-left: 6px;">OC-${String(ordenId).padStart(4, '0')}</span>
                  <span style="font-size: 10px; color: #94a3b8; margin-left: 12px;">|</span>
                  <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 700; margin-left: 12px;">Fecha:</span>
                  <span style="font-size: 13px; color: #1e293b; font-weight: 600; margin-left: 6px;">${fechaFormateada}</span>
                </td>
              </tr>
            </table>
          </div>

          <!-- TABLA DE PRODUCTOS -->
          <div style="padding: 20px;">
            <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-weight: 700; margin: 0 0 12px 0;">Productos Solicitados</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; text-align: left;">Producto</th>
                  <th style="padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; text-align: center;">Cantidad</th>
                  <th style="padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; text-align: right;">Subtotal Ref.</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
              </tbody>
              <tfoot>
                <tr style="background: #f8fafc; border-top: 2px solid #e2e8f0;">
                  <td colspan="2" style="padding: 14px 12px; font-size: 13px; font-weight: 800; color: #1e293b; text-align: right; text-transform: uppercase; letter-spacing: 0.05em;">Total Referencia:</td>
                  <td style="padding: 14px 12px; font-size: 16px; font-weight: 800; color: #4f46e5; text-align: right;">${formatCOP(totalGeneral)}</td>
                </tr>
              </tfoot>
            </table>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #94a3b8; font-style: italic;">* Los valores son de referencia interna. Los precios finales quedan sujetos a confirmación del proveedor.</p>
          </div>

          <!-- MENSAJE PERSONALIZADO -->
          ${mensaje_personalizado ? `
          <div style="padding: 0 30px 25px 30px;">
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px;">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #3b82f6; font-weight: 700; margin-bottom: 6px;">Mensaje del Comprador:</p>
              <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.6;">${mensaje_personalizado}</p>
            </div>
          </div>
          ` : ''}

          <!-- CONTACTO -->
          <div style="padding: 20px 30px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.8;">
              <strong>Contacto para confirmar:</strong> ${admin ? admin.nombres : 'Administrador'} — ${admin ? admin.correo : process.env.EMAIL_USER}
              ${orden.tienda_celular ? ' | Tel: ' + orden.tienda_celular : ''}
            </p>
          </div>

          <!-- PIE -->
          <div style="padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
              Orden generada automáticamente por <strong>StockPilot</strong>. Para responder, use el botón "Responder" de su cliente de correo.
            </p>
          </div>
        </div>
      `;

      // 6. Enviar el correo
      const mailOptions = {
        from: `"${orden.nombre_establecimiento} vía StockPilot" <${process.env.EMAIL_USER}>`,
        to: orden.proveedor_email,
        replyTo: admin ? admin.correo : process.env.EMAIL_USER,
        subject: `📋 Orden de Compra OC-${String(ordenId).padStart(4, '0')} — ${orden.nombre_establecimiento}`,
        html: htmlEmail
      };

      await transporter.sendMail(mailOptions);

      // 7. Actualizar estado a 'Enviada'
      await db.runAsync(
        'UPDATE Ordenes_Compra SET estado = ? WHERE id_orden = ?',
        ['Enviada', ordenId]
      );

      console.log(`📧 [Orden] Orden #${ordenId} enviada exitosamente a ${orden.proveedor_email} (Proveedor: ${orden.nombre_empresa})`);

      res.json({ 
        success: true, 
        message: `Orden enviada exitosamente a ${orden.proveedor_email}`,
        email_destino: orden.proveedor_email
      });

    } catch (e) {
      console.error('❌ [Orden] Error al enviar orden por email:', e);
      res.status(500).json({ success: false, error: 'Error al enviar el correo: ' + e.message });
    }
  },

  /**
   * Registra un pago (abono) a una orden de compra.
   * Módulo: Inteligencia Financiera / Cuentas por Pagar.
   */
  registerPayment: async (req, res) => {
    try {
      const { ordenId } = req.params;
      const { monto } = req.body;
      const tiendaId = req.session.tiendaId;

      if (!monto || monto <= 0) {
        return res.status(400).json({ success: false, error: 'Monto inválido.' });
      }

      const orden = await db.getAsync(
        'SELECT presupuesto_total, monto_pagado FROM Ordenes_Compra WHERE id_orden = ? AND id_tienda = ?',
        [ordenId, tiendaId]
      );

      if (!orden) return res.status(404).json({ success: false, error: 'Orden no encontrada.' });

      const nuevoMontoPagado = (orden.monto_pagado || 0) + parseFloat(monto);
      let nuevoEstadoPago = 'Abonado';
      
      if (nuevoMontoPagado >= orden.presupuesto_total) {
        nuevoEstadoPago = 'Pagado';
      }

      await db.runAsync(
        'UPDATE Ordenes_Compra SET monto_pagado = ?, estado_pago = ? WHERE id_orden = ?',
        [nuevoMontoPagado, nuevoEstadoPago, ordenId]
      );

      res.json({ 
        success: true, 
        message: 'Pago registrado con éxito.',
        nuevoSaldo: Math.max(0, orden.presupuesto_total - nuevoMontoPagado)
      });

    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  }
};

module.exports = suppliersController;

