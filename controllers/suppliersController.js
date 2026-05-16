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
               (SELECT COALESCE(SUM(presupuesto_total - monto_pagado), 0) FROM Ordenes_Compra WHERE id_proveedor = p.id_proveedor) as total_deuda
        FROM Proveedores p
        WHERE p.id_tienda = ? AND (p.estado = 'Activo' OR p.estado IS NULL)
        ORDER BY p.nombre_empresa ASC
      `;
      const rows = await db.allAsync(query, [tiendaId]);
      
      const data = rows.map(r => ({
        ...r,
        productos_vinculados: Number(r.productos_vinculados),
        total_deuda: Number(r.total_deuda)
      }));

      res.json({ success: true, data });
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
        INSERT INTO Proveedores (id_tienda, nombre_empresa, contacto_principal, email, correo, telefono, direccion, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo')
      `;
      const st = await db.runAsync(query, [tiendaId, nombre_empresa, contacto_principal, email, email, telefono, direccion]);
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
        SET nombre_empresa = ?, contacto_principal = ?, email = ?, correo = ?, telefono = ?, direccion = ?
        WHERE id_proveedor = ? AND id_tienda = ?
      `;
      await db.runAsync(query, [nombre_empresa, contacto_principal, email, email, telefono, direccion, id, tiendaId]);
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
      const query = `UPDATE Proveedores SET estado = 'Inactivo' WHERE id_proveedor = ? AND id_tienda = ?`;
      await db.runAsync(query, [id, tiendaId]);
      res.json({ success: true, message: 'Proveedor eliminado del sistema' });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  },

  // Forecast Matemático
  getSupplierForecast: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      const { proveedorId } = req.params;
      const query = `
        SELECT 
          p.id_producto, p.nombre_producto, p.cantidad as stock_actual, p.precio, p.stock_seguridad, p.lead_time,
          COALESCE(
            (SELECT SUM(vp.cantidad) FROM VentasProductos vp JOIN Ventas v ON vp.id_venta = v.id_venta 
             WHERE vp.id_producto = p.id_producto AND v.fecha_salida >= CURRENT_DATE - INTERVAL '30 days'
            ), 0) / 30.0 as velocity_30d,
          COALESCE(
            (SELECT AVG(factor_precision) FROM (
              SELECT factor_precision FROM Feedback_IA f 
              WHERE f.id_producto = p.id_producto 
              ORDER BY fecha_evaluacion DESC LIMIT 5
            ) as sub), 1.0) as factor_ia
        FROM Productos p
        WHERE p.id_tienda = ? AND p.id_proveedor = ? AND p.estado = 'Disponible'
      `;
      const rows = await db.allAsync(query, [tiendaId, proveedorId]);
      let totalRevenue = 0;
      const productsWithMath = rows.map(r => {
        const v30 = Number(r.velocity_30d || 0);
        const fIA = Number(r.factor_ia || 1.0);
        const rev = v30 * 30 * r.precio;
        totalRevenue += rev;
        const rop_base = (v30 * r.lead_time) + r.stock_seguridad;
        const rop = Math.ceil(rop_base * fIA);
        const days = v30 > 0.01 ? Math.round(r.stock_actual / v30) : Infinity;
        return { ...r, velocity_30d: v30, factor_ia: fIA, revenue: rev, rop, days_to_exhaust: days };
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
        // Crítico/medio: cubrir hasta ROP. Stock suficiente: sugerir 1 semana de ventas (mínimo 1).
        const qtyCritica = risk !== 'low' ? Math.max(0, item.rop - item.stock_actual) : 0;
        const qtySugerida = qtyCritica > 0 ? qtyCritica : Math.max(1, Math.ceil(item.velocity_30d * 7));
        return {
          id_producto: item.id_producto,
          nombre: item.nombre_producto,
          clasificacion_abc: category,
          nivel_riesgo: risk,
          stock: item.stock_actual,
          dias_inventario: item.days_to_exhaust,
          factor_aprendizaje_ia: item.factor_ia.toFixed(2),
          cantidad_sugerida: qtySugerida,
          presupuesto_estimado: qtySugerida * item.precio
        };
      });
      res.json({ success: true, proveedor_id: proveedorId, recomendaciones_matematicas: smartList, total_presupuesto_base: smartList.reduce((acc, curr) => acc + curr.presupuesto_estimado, 0) });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  },

  // Generar Orden Inteligente (IA)
  generateSmartOrder: async (req, res) => {
    try {
      const { proveedorId } = req.params;
      const { recomendaciones_matematicas, presupuesto_maximo } = req.body;
      if (!recomendaciones_matematicas || recomendaciones_matematicas.length === 0) return res.status(400).json({ success: false, error: 'No hay productos para analizar.' });
      const totalCost = recomendaciones_matematicas.reduce((acc, curr) => acc + curr.presupuesto_estimado, 0);
      const itemsCriticos = recomendaciones_matematicas.filter(r => r.nivel_riesgo === 'critical').length;
      let riskLevel = 'Bajo';
      let riskReason = 'Presupuesto holgado y riesgos de stock controlables.';
      const budgetLimit = presupuesto_maximo || 1000000;
      if (totalCost > budgetLimit) { riskLevel = 'Alto'; riskReason = 'El costo total excede el presupuesto máximo establecido.'; }
      else if (itemsCriticos > 0) { riskLevel = 'Medio'; riskReason = `Existen ${itemsCriticos} productos en estado crítico de agotamiento.`; }
      const promptData = recomendaciones_matematicas.map(r => ({ id: r.id_producto, producto: r.nombre, abc: r.clasificacion_abc, sugerencia_matematica: r.cantidad_sugerida }));
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: "Asesor Comercial Pyme. Ajusta sugerencias: A (max +100%), B (+50%), C (+20%). Responde JSON: { \"ajustes\": [ { \"id\": ID, \"porcentaje\": \"+15%\", \"razon\": \"...\" } ] }" }, { role: "user", content: JSON.stringify(promptData) }],
        response_format: { type: "json_object" }
      });
      const iaResponse = JSON.parse(completion.choices[0].message.content);
      const adjustments = iaResponse.ajustes || [];
      const finalCart = recomendaciones_matematicas.map(item => {
        const aiMemory = adjustments.find(a => a.id === item.id_producto);
        const adjNum = aiMemory ? parseInt(aiMemory.porcentaje.replace(/[^0-9-]/g, '')) || 0 : 0;
        let limit = item.clasificacion_abc === 'A' ? 100 : (item.clasificacion_abc === 'B' ? 50 : 20);
        const clampedAdj = Math.min(Math.max(adjNum, -50), limit);
        const finalQty = Math.ceil(item.cantidad_sugerida * (1 + clampedAdj / 100));
        return { ...item, calculo_base: item.cantidad_sugerida, ajuste_ia: clampedAdj > 0 ? ('+' + clampedAdj + '%') : (clampedAdj + '%'), sugerencia_final: finalQty, razon_ia: aiMemory ? aiMemory.razon : 'Sin ajuste inteligente aplicable.', presupuesto_estimado_final: Math.round(finalQty * (item.presupuesto_estimado / item.cantidad_sugerida || 0)) };
      });
      res.json({ success: true, evaluacion_riesgo: { nivel: riskLevel, justificacion: riskReason, costo_total_estimado: finalCart.reduce((acc, curr) => acc + curr.presupuesto_estimado_final, 0) }, carrito_inteligente: finalCart });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  },

  // Registrar Orden Inteligente (Sincronizado con PG)
  submitSmartOrder: async (req, res) => {
    const client = await db.getClient();
    try {
      const { proveedorId } = req.params;
      const tiendaId = req.session.tiendaId;
      const userId = req.session.userId || 1;
      const { carrito_final, evaluacion_riesgo, estado_deseado, notas_humanas } = req.body;

      await client.query('BEGIN');

      // IMPORTANTE: Usar RETURNING para obtener el ID en Postgres
      const insertOrdenQuery = `
        INSERT INTO Ordenes_Compra (id_tienda, id_proveedor, id_usuario, estado, riesgo, presupuesto_total, notas) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id_orden
      `;
      const ordenRes = await client.query(insertOrdenQuery, [
        tiendaId, proveedorId, userId, 
        estado_deseado || 'Borrador', 
        evaluacion_riesgo.nivel, 
        evaluacion_riesgo.costo_total_estimado, 
        notas_humanas || 'Sin notas.'
      ]);
      
      const ordenId = ordenRes.rows[0].id_orden;

      for (const item of carrito_final) {
        const iaPorcentaje = item.ajuste_ia ? parseInt(item.ajuste_ia.replace(/[^0-9-]/g, '')) : 0;
        const costoUnit = item.presupuesto_estimado_final / item.sugerencia_final || 0;
        await client.query(
          "INSERT INTO Ordenes_Detalle (id_orden, id_producto, cantidad_sugerida, sugerencia_ia, cantidad_final, costo_unitario) VALUES ($1, $2, $3, $4, $5, $6)",
          [ordenId, item.id_producto, item.calculo_base, iaPorcentaje, item.sugerencia_final, costoUnit]
        );
      }

      await client.query('COMMIT');
      res.json({ success: true, message: 'Orden Inteligente creada', orden_id: ordenId });

    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: e.message });
    } finally {
      client.release();
    }
  },

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
      res.json({ success: true, data: rows.map(r => ({ ...r, items_count: Number(r.items_count), presupuesto_total: Number(r.presupuesto_total), monto_pagado: Number(r.monto_pagado), saldo_pendiente: Number(r.saldo_pendiente) })) });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  },

  getOrderDetail: async (req, res) => {
    try {
      const { ordenId } = req.params;
      const rows = await db.allAsync("SELECT d.*, p.nombre_producto FROM Ordenes_Detalle d JOIN Productos p ON d.id_producto = p.id_producto WHERE d.id_orden = ?", [ordenId]);
      res.json({ success: true, data: rows.map(r => ({ ...r, cantidad_final: Number(r.cantidad_final), costo_unitario: Number(r.costo_unitario) })) });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  },

  // --- FUNCIONES FALTANTES RESTAURADAS ---
  updateOrderStatus: async (req, res) => {
    try {
      const { ordenId } = req.params;
      const tiendaId = req.session.tiendaId;
      const { estado, notas } = req.body;
      const query = 'UPDATE Ordenes_Compra SET estado = ?, notas = COALESCE(?, notas) WHERE id_orden = ? AND id_tienda = ?';
      await db.runAsync(query, [estado, notas || null, ordenId, tiendaId]);
      res.json({ success: true, message: `Orden #${ordenId} actualizada.` });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  },

  registerPayment: async (req, res) => {
    try {
      const { ordenId } = req.params;
      const { monto } = req.body;
      const tiendaId = req.session.tiendaId;
      const orden = await db.getAsync('SELECT presupuesto_total, monto_pagado FROM Ordenes_Compra WHERE id_orden = ? AND id_tienda = ?', [ordenId, tiendaId]);
      if (!orden) return res.status(404).json({ error: 'No existe' });
      const nuevoPagado = Number(orden.monto_pagado) + Number(monto);
      const estado = nuevoPagado >= Number(orden.presupuesto_total) ? 'Pagado' : 'Abonado';
      await db.runAsync('UPDATE Ordenes_Compra SET monto_pagado = ?, estado_pago = ? WHERE id_orden = ?', [nuevoPagado, estado, ordenId]);
      res.json({ success: true, saldo: Math.max(0, Number(orden.presupuesto_total) - nuevoPagado) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  sendOrderToSupplier: async (req, res) => {
    try {
      const { ordenId } = req.params;
      const tiendaId = req.session.tiendaId;
      const orden = await db.getAsync(`SELECT o.*, p.nombre_empresa, p.email as proveedor_email FROM Ordenes_Compra o JOIN Proveedores p ON o.id_proveedor = p.id_proveedor WHERE o.id_orden = ?`, [ordenId]);
      if (!orden || !orden.proveedor_email) return res.status(400).json({ error: 'Falta email proveedor' });
      const items = await db.allAsync(`SELECT d.*, p.nombre_producto FROM Ordenes_Detalle d JOIN Productos p ON d.id_producto = p.id_producto WHERE d.id_orden = ?`, [ordenId]);
      
      const nombreTienda = req.session.nombreTienda || 'StockPilot';
      const fechaEmision = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
      const itemsRows = items.map(i => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px;">${i.nombre_producto}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px; text-align: center;">${i.cantidad_final}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; text-align: right;">${i.costo_unitario != null ? '$' + Number(i.costo_unitario).toLocaleString('es-CO') : '—'}</td>
        </tr>
      `).join('');

      const mailOptions = {
        from: `"${nombreTienda} via StockPilot" <${process.env.EMAIL_USER}>`,
        to: orden.proveedor_email,
        subject: `Orden de Compra #${ordenId} — ${nombreTienda}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; max-width: 620px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #4f46e5; padding: 28px 32px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; letter-spacing: -0.025em;">StockPilot</h1>
                    <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.75); font-size: 12px;">Control de Inventario Inteligente</p>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-block; background: rgba(255,255,255,0.15); border-radius: 8px; padding: 8px 16px;">
                      <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700;">Orden #${ordenId}</p>
                      <p style="margin: 2px 0 0 0; color: rgba(255,255,255,0.8); font-size: 11px;">${fechaEmision}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <div style="padding: 28px 32px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; font-weight: 600;">Dirigido a</p>
              <h2 style="margin: 0 0 18px 0; font-size: 20px; color: #1e293b;">${orden.nombre_empresa}</h2>

              <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                Por medio del presente, <strong>${nombreTienda}</strong> emite la siguiente orden de compra. Por favor confirmar disponibilidad y tiempo de entrega estimado.
              </p>

              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #e2e8f0;">Producto</th>
                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #e2e8f0;">Cantidad</th>
                    <th style="padding: 10px 12px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #e2e8f0;">Costo Unit.</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>
            </div>

            <div style="background-color: #f8fafc; padding: 18px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Orden generada automáticamente por <strong>StockPilot AI Core</strong> · ${nombreTienda}
              </p>
            </div>
          </div>
        `
      };
      await transporter.sendMail(mailOptions);
      await db.runAsync('UPDATE Ordenes_Compra SET estado = ? WHERE id_orden = ?', ['Enviada', ordenId]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};

module.exports = suppliersController;
