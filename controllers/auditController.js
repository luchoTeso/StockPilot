// controllers/auditController.js
const db = require('../config/database');

const auditController = {
  /**
   * GET /api/auditoria
   * Lista paginada de registros de Auditoria_IA
   */
  getLogs: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;
      const offset = (page - 1) * limit;
      const fuente = req.query.fuente || ''; // 'dashboard', 'proveedor', ''

      let whereClause = 'WHERE a.id_tienda = ?';
      const params = [tiendaId];

      if (fuente === 'dashboard') {
        whereClause += ' AND a.id_orden IS NULL';
      } else if (fuente === 'proveedor') {
        whereClause += ' AND a.id_orden IS NOT NULL';
      }

      // Total count
      const countRow = await db.getAsync(
        `SELECT COUNT(*) as total FROM Auditoria_IA a ${whereClause}`, params
      );

      // Records with order info if available
      const rows = await db.allAsync(`
        SELECT a.*, 
          o.estado as orden_estado, 
          p.nombre_empresa as proveedor_nombre
        FROM Auditoria_IA a
        LEFT JOIN Ordenes_Compra o ON a.id_orden = o.id_orden
        LEFT JOIN Proveedores p ON o.id_proveedor = p.id_proveedor
        ${whereClause}
        ORDER BY a.fecha_auditoria DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      res.json({
        success: true,
        data: rows,
        pagination: {
          page,
          limit,
          total: countRow.total,
          totalPages: Math.ceil(countRow.total / limit)
        }
      });
    } catch (err) {
      console.error('Error en auditoria getLogs:', err);
      res.status(500).json({ success: false, error: 'Error al consultar auditoría' });
    }
  },

  /**
   * GET /api/auditoria/stats
   * Estadísticas resumidas de la auditoría IA
   */
  getStats: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;

      const [total, fromDashboard, fromProveedores, ultima] = await Promise.all([
        db.getAsync('SELECT COUNT(*) as total FROM Auditoria_IA WHERE id_tienda = ?', [tiendaId]),
        db.getAsync('SELECT COUNT(*) as total FROM Auditoria_IA WHERE id_tienda = ? AND id_orden IS NULL', [tiendaId]),
        db.getAsync('SELECT COUNT(*) as total FROM Auditoria_IA WHERE id_tienda = ? AND id_orden IS NOT NULL', [tiendaId]),
        db.getAsync('SELECT fecha_auditoria FROM Auditoria_IA WHERE id_tienda = ? ORDER BY fecha_auditoria DESC LIMIT 1', [tiendaId])
      ]);

      res.json({
        success: true,
        stats: {
          total: total.total,
          desde_dashboard: fromDashboard.total,
          desde_proveedores: fromProveedores.total,
          ultima_consulta: ultima ? ultima.fecha_auditoria : null
        }
      });
    } catch (err) {
      console.error('Error en auditoria getStats:', err);
      res.status(500).json({ success: false, error: 'Error al consultar estadísticas' });
    }
  }
};

module.exports = auditController;
