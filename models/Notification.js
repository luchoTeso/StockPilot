const db = require('../config/database');

class Notification {
    /**
     * Crea una nueva notificación para un usuario
     */
    static async create({ id_usuario, id_tienda, tipo, titulo, mensaje, datos_json = null }) {
        // Handle datos_json if it's already a string
        const parsedDatosJson = (typeof datos_json === 'object' && datos_json !== null) 
            ? JSON.stringify(datos_json) 
            : datos_json;
            
        return await db.runAsync(
            `INSERT INTO NotificacionesUsuario (id_usuario, id_tienda, tipo, titulo, mensaje, datos_json)
             VALUES (?, ?, ?, ?, ?, ?) RETURNING id_notificacion`,
            [id_usuario, id_tienda, tipo, titulo, mensaje, parsedDatosJson]
        );
    }

    /**
     * Envía una notificación a todos los tenderos de una tienda
     */
    static async broadcast({ id_tienda, tipo, titulo, mensaje, datos_json = null }) {
        const tenderos = await db.allAsync(
            'SELECT id_usuario FROM Usuarios WHERE id_tienda = ? AND rol = ?',
            [id_tienda, 'Tendero']
        );
        let count = 0;
        for (const t of tenderos) {
            await this.create({ 
                id_usuario: t.id_usuario, 
                id_tienda, 
                tipo, 
                titulo, 
                mensaje, 
                datos_json 
            });
            count++;
        }
        return count;
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
