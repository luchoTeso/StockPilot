// models/Report.js
const db = require('../config/database');

class Report {
    static async create(reportData) {
        const { titulo, descripcion, fecha_reporte, creador, tipo, id_tienda, fecha_inicio, fecha_fin } = reportData;
        
        const query = `
            INSERT INTO reportes (titulo, descripcion, fecha_reporte, creador, tipo, id_tienda, fecha_inicio, fecha_fin)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await db.runAsync(query, [
            titulo, descripcion, fecha_reporte, creador, tipo, id_tienda, 
            fecha_inicio || null, fecha_fin || null
        ]);
        return result.lastID;
    }

    static async findAll() {
        const query = `SELECT * FROM reportes ORDER BY fecha_reporte DESC`;
        return await db.allAsync(query);
    }

    static async findByStore(storeId) {
        const query = `SELECT * FROM reportes WHERE id_tienda = ? ORDER BY fecha_reporte DESC`;
        return await db.allAsync(query, [storeId]);
    }

    static async findById(id) {
        const query = `SELECT * FROM reportes WHERE id = ?`;
        return await db.getAsync(query, [id]);
    }

    static async update(id, reportData) {
        const { titulo, descripcion, fecha_reporte, creador, tipo, fecha_inicio, fecha_fin } = reportData;
        
        const query = `
            UPDATE reportes
            SET titulo = ?, descripcion = ?, fecha_reporte = ?, creador = ?, tipo = ?, fecha_inicio = ?, fecha_fin = ?
            WHERE id = ?
        `;
        const result = await db.runAsync(query, [
            titulo, descripcion, fecha_reporte, creador, tipo, 
            fecha_inicio || null, fecha_fin || null, id
        ]);
        return result.changes > 0;
    }

    static async delete(id) {
        const query = `DELETE FROM reportes WHERE id = ?`;
        const result = await db.runAsync(query, [id]);
        return result.changes > 0;
    }
}

module.exports = Report;