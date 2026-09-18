const db = require('../config/database');

class Notification {
    /**
     * Crea una nueva notificación para un usuario
     */
    static async create({ id_usuario, id_tienda, tipo, titulo, mensaje, datos_json = null }) {
        return await db.runAsync(
            `INSERT INTO NotificacionesUsuario (id_usuario, id_tienda, tipo, titulo, mensaje, datos_json)
             VALUES (?, ?, ?, ?, ?, ?) RETURNING id_notificacion`,
            [id_usuario, id_tienda, tipo, titulo, mensaje, datos_json ? JSON.stringify(datos_json) : null]
        );
    }

    /**
     * Obtiene notificaciones no leídas de un usuario
     */
    static async getUnread(id_usuario, limit = 10) {
        return await db.allAsync(
            `SELECT * FROM NotificacionesUsuario
             WHERE id_usuario = ? AND leida = 0
             ORDER BY fecha_creacion DESC
             LIMIT ?`,
            [id_usuario, limit]
        );
    }

    /**
     * Cuenta las notificaciones no leídas
     */
    static async countUnread(id_usuario) {
        const result = await db.getAsync(
            `SELECT COUNT(*) as total FROM NotificacionesUsuario
             WHERE id_usuario = ? AND leida = 0`,
            [id_usuario]
        );
        return parseInt(result.total, 10) || 0;
    }

    /**
     * Marca una notificación como leída
     */
    static async markAsRead(id_notificacion, id_usuario) {
        return await db.runAsync(
            `UPDATE NotificacionesUsuario SET leida = 1, fecha_lectura = CURRENT_TIMESTAMP
             WHERE id_notificacion = ? AND id_usuario = ?`,
            [id_notificacion, id_usuario]
        );
    }

    /**
     * Marca todas las notificaciones del usuario como leídas
     */
    static async markAllAsRead(id_usuario) {
        return await db.runAsync(
            `UPDATE NotificacionesUsuario SET leida = 1, fecha_lectura = CURRENT_TIMESTAMP
             WHERE id_usuario = ? AND leida = 0`,
            [id_usuario]
        );
    }
}

module.exports = Notification;
