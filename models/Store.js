// models/Store.js
const db = require('../config/database');

class Store {
    static async create(storeData) {
        const query = `
            INSERT INTO Tienda (nombre_establecimiento, direccion, anio_creacion, estado) 
            VALUES (?, ?, ?, ?)
        `;
        const result = await db.runAsync(query, [
            storeData.nombre_establecimiento,
            storeData.direccion,
            storeData.anio_creacion,
            'Activo'
        ]);
        return result.lastID;
    }

    static async findById(storeId) {
        const query = `
            SELECT id_tienda, nombre_establecimiento, direccion, anio_creacion, estado,
                   documento, razon_social, celular, ciudad
            FROM Tienda
            WHERE id_tienda = ?
        `;
        return await db.getAsync(query, [storeId]);
    }

    static async update(storeId, data) {
        const query = `
            UPDATE Tienda SET 
                nombre_establecimiento = ?,
                direccion = ?,
                documento = ?,
                razon_social = ?,
                celular = ?,
                ciudad = ?
            WHERE id_tienda = ?
        `;
        const result = await db.runAsync(query, [
            data.nombre_establecimiento,
            data.direccion,
            data.documento,
            data.razon_social,
            data.celular,
            data.ciudad,
            storeId
        ]);
        return result.changes > 0;
    }

    static async delete(storeId) {
        const query = `DELETE FROM Tienda WHERE id_tienda = ?`;
        const result = await db.runAsync(query, [storeId]);
        return result.changes > 0;
    }

    static async toggleStatus(storeId) {
        // Primero obtener el estado actual
        const store = await this.findById(storeId);
        if (!store) throw new Error('Tienda no encontrada');

        const nuevoEstado = store.estado === "Activo" ? "Inactivo" : "Activo";
        
        const query = `UPDATE Tienda SET estado = ? WHERE id_tienda = ?`;
        const result = await db.runAsync(query, [nuevoEstado, storeId]);
        
        return { 
            success: result.changes > 0, 
            nuevoEstado 
        };
    }
}

module.exports = Store;