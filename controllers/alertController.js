const Alert = require('../models/Alert');

const alertController = {
  // Dispara el recálculo (suele invocarse manualmente o por cron en el futuro)
  generateAlerts: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId; 
      const cantidadGeneradas = await Alert.generate(tiendaId);
      res.json({ success: true, generadas: cantidadGeneradas });
    } catch (e) {
      console.error('Error generando alertas:', e);
      res.status(500).json({ success: false, error: 'Hubo un error al ejecutar el motor de reglas.' });
    }
  },

  // Obtiene la lista visible de alertas activas
  getActiveAlerts: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      const filters = {};
      if (req.query.tipo) filters.tipo = req.query.tipo;
      if (req.query.severidad) filters.severidad = req.query.severidad;

      const alerts = await Alert.findActive(tiendaId, filters);
      res.json({ success: true, alerts });
    } catch (e) {
      console.error('Error obteniendo alertas:', e);
      res.status(500).json({ success: false, error: 'Error al consultar las alertas.' });
    }
  },

  // Obtiene los conteos agregados para la navegación
  getStats: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      const stats = await Alert.getStats(tiendaId);
      res.json({ success: true, stats });
    } catch (e) {
      console.error('Error analizando stats:', e);
      res.status(500).json({ success: false, error: 'Error obteniendo resúmen de alertas.' });
    }
  },

  // Marca una alerta como resuelta
  resolveAlert: async (req, res) => {
    try {
      const tiendaId = req.session.tiendaId;
      const alertaId = req.params.id;
      await Alert.resolve(alertaId, tiendaId);
      res.json({ success: true, message: 'Alerta archivada.' });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Error al archivar la alerta.' });
    }
  }
};

module.exports = alertController;
