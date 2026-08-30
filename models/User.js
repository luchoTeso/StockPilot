// models/User.js
const db = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

class User {
    static async findByCredentials(login, password, rol) {
        // Buscar usuario sin comparar contraseña en SQL
        const query = `
            SELECT * FROM Usuarios 
            WHERE (usuario = ? OR correo = ?) 
            AND rol = ?
        `;
        const user = await db.getAsync(query, [login, login, rol]);

        if (!user) return null;

        // Comparar contraseña con bcrypt
        const match = await bcrypt.compare(password, user.contrasena);
        return match ? user : null;
    }

    static async create(userData) {
        // Hashear la contraseña antes de guardar
        const hashedPassword = await bcrypt.hash(userData.contrasena, SALT_ROUNDS);

        const query = `
            INSERT INTO Usuarios (
                nombres, genero, correo, celular, 
                usuario, contrasena, rol, id_tienda, cambio_clave_forzoso
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await db.runAsync(query, [
            userData.nombres,
            userData.genero,
            userData.correo,
            userData.celular,
            userData.usuario,
            hashedPassword,
            userData.rol,
            userData.id_tienda,
            userData.cambio_clave_forzoso ? true : false
        ]);
        return result.lastID;
    }

    static async findById(userId) {
        const query = `
            SELECT id_usuario, nombres, genero, correo, celular, usuario, rol, id_tienda, foto_url, cambio_clave_forzoso
            FROM Usuarios WHERE id_usuario = ?
        `;
        return await db.getAsync(query, [userId]);
    }

    static async findByStore(storeId) {
        const query = `
            SELECT id_usuario, nombres, genero, correo, celular, usuario, rol
            FROM Usuarios 
            WHERE id_tienda = ?
            ORDER BY id_usuario
        `;
        return await db.allAsync(query, [storeId]);
    }

    static async findTenderosByStore(storeId) {
        const query = `
            SELECT id_usuario, nombres, genero, correo, celular, usuario
            FROM Usuarios
            WHERE rol = 'Tendero' AND id_tienda = ?
            ORDER BY id_usuario
        `;
        return await db.allAsync(query, [storeId]);
    }

    static async update(userId, userData) {
        const query = `
            UPDATE Usuarios SET
            nombres = ?, genero = ?, correo = ?, celular = ?, usuario = ?, foto_url = ?
            WHERE id_usuario = ?
        `;
        const result = await db.runAsync(query, [
            userData.nombres,
            userData.genero,
            userData.correo,
            userData.celular,
            userData.usuario,
            userData.foto_url || null,
            userId
        ]);
        return result.changes > 0;
    }

    static async updatePassword(userId, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        const query = `UPDATE Usuarios SET contrasena = ?, cambio_clave_forzoso = 0 WHERE id_usuario = ?`;
        const result = await db.runAsync(query, [hashedPassword, userId]);
        return result.changes > 0;
    }

    static async delete(userId, storeId) {
        const query = `
            DELETE FROM Usuarios 
            WHERE id_usuario = ? AND id_tienda = ? AND rol = 'Tendero'
        `;
        const result = await db.runAsync(query, [userId, storeId]);
        return result.changes > 0;
    }

    static async findByEmail(email) {
        const query = `SELECT id_usuario, nombres, correo FROM Usuarios WHERE correo = ?`;
        return await db.getAsync(query, [email]);
    }

    static async setResetToken(userId, token, expires) {
        const query = `UPDATE Usuarios SET reset_token = ?, reset_expires = ? WHERE id_usuario = ?`;
        await db.runAsync(query, [token, expires.getTime(), userId]);
    }

    static async verifyResetToken(email, token) {
        const query = `
            SELECT id_usuario FROM Usuarios 
            WHERE correo = ? AND reset_token = ? AND reset_expires > ?
        `;
        return await db.getAsync(query, [email, token, Date.now()]);
    }

    static async clearResetToken(userId) {
        const query = `UPDATE Usuarios SET reset_token = NULL, reset_expires = NULL WHERE id_usuario = ?`;
        await db.runAsync(query, [userId]);
    }

    static async setCurrentSession(userId, sessionId) {
        const query = `UPDATE Usuarios SET session_id = ? WHERE id_usuario = ?`;
        await db.runAsync(query, [sessionId, userId]);
    }

    static async verifyCurrentSession(userId, sessionId) {
        const query = `SELECT session_id FROM Usuarios WHERE id_usuario = ?`;
        const user = await db.getAsync(query, [userId]);
        return user && user.session_id === sessionId;
    }
}

module.exports = User;