// models/Store.js
const db = require('../config/database');

class Store {
    static async create(storeData) {
        const query = `
            INSERT INTO Tienda (nombre_establecimiento, direccion, anio_creacion, estado, id_propietario) 
            VALUES (?, ?, ?, ?, ?)
            RETURNING id_tienda
        `;
        const result = await db.runAsync(query, [
            storeData.nombre_establecimiento,
            storeData.direccion,
            storeData.anio_creacion,
            'Activo',
            storeData.id_propietario || null
        ]);
        // db.runAsync con pg retorna ROWS cuando hay RETURNING. Si es la versión que simula runAsync con pg, podría devolver el objeto en row.
        // Verificando cómo db.runAsync fue configurado en db.js. Si antes usaba lastID (SQLite), ahora con pg usará RETURNING o algo similar.
        // En config/database.js adaptaron lastID. Mantengo result.lastID si está mapeado, pero mejor garantizo compatibilidad:
        return result.lastID;
    }

    static async findById(storeId) {
        const query = `
            SELECT id_tienda, nombre_establecimiento, direccion, anio_creacion, estado,
                   documento, razon_social, celular, ciudad, id_propietario, limite_egreso_tendero
            FROM Tienda
            WHERE id_tienda = ?
        `;
        return await db.getAsync(query, [storeId]);
    }

    static async findByOwner(userId) {
        const query = `
            SELECT id_tienda, nombre_establecimiento, direccion, anio_creacion, estado,
                   documento, razon_social, celular, ciudad, id_propietario, limite_egreso_tendero
            FROM Tienda
            WHERE id_propietario = ?
            ORDER BY id_tienda
        `;
        return await db.allAsync(query, [userId]);
    }

    static async update(storeId, data) {
        // Construimos el query dinámicamente según los campos que vengan en `data`
        const fields = [];
        const values = [];

        if (data.nombre_establecimiento !== undefined) { fields.push('nombre_establecimiento = ?'); values.push(data.nombre_establecimiento); }
        if (data.direccion !== undefined) { fields.push('direccion = ?'); values.push(data.direccion); }
        if (data.documento !== undefined) { fields.push('documento = ?'); values.push(data.documento); }
        if (data.razon_social !== undefined) { fields.push('razon_social = ?'); values.push(data.razon_social); }
        if (data.celular !== undefined) { fields.push('celular = ?'); values.push(data.celular); }
        if (data.ciudad !== undefined) { fields.push('ciudad = ?'); values.push(data.ciudad); }
        if (data.limite_egreso_tendero !== undefined) { fields.push('limite_egreso_tendero = ?'); values.push(data.limite_egreso_tendero); }

        if (fields.length === 0) return true; // Nada que actualizar

        values.push(storeId);
        const query = `UPDATE Tienda SET ${fields.join(', ')} WHERE id_tienda = ?`;
        
        const result = await db.runAsync(query, values);
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