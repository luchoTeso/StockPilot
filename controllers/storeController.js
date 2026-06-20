// controllers/storeController.js
const Store = require('../models/Store');
const User = require('../models/User');
const { safeError, verifyStoreOwnership } = require('../utils/securityUtils');

class StoreController {
    static async getStoreInfo(req, res) {
        try {
            const usuarioId = req.session.userId;

            if (!usuarioId) {
                return res.status(401).json({ success: false, error: "Usuario no autenticado" });
            }

            // Fix #11: usar modelo en vez de acceso directo a DB
            const usuario = await User.findById(usuarioId);
            
            if (!usuario) {
                return res.status(404).json({ success: false, error: "Usuario no encontrado" });
            }

            const tiendaId = usuario.id_tienda;

            // Obtener información de la tienda
            const tienda = await Store.findById(tiendaId);
            if (!tienda) {
                return res.status(404).json({ success: false, error: "Tienda no encontrada" });
            }

            // Obtener usuarios de la tienda
            const usuarios = await User.findByStore(tiendaId);

            res.json({
                success: true,
                tienda,
                usuarios
            });
        } catch (error) {
            console.error('Error obteniendo información de tienda:', error);
            res.status(500).json({ success: false, error: "Error consultando información" });
        }
    }

    static async updateStore(req, res) {
        try {
            if (!req.session.userId) {
                return res.status(401).json({ success: false, error: "No autenticado" });
            }

            const storeId = parseInt(req.params.id);
            if (!storeId) {
                return res.status(400).json({ success: false, error: "ID inválido" });
            }

            // 🛡️ IDOR: Verificar que la tienda es la del usuario
            if (!verifyStoreOwnership(storeId, req.session.tiendaId)) {
                return res.status(403).json({ success: false, error: "No autorizado para esta tienda" });
            }

            const { nombre_establecimiento, direccion, documento, razon_social, celular, ciudad } = req.body;

            // Validate required fields
            if (!nombre_establecimiento || !direccion) {
                return res.status(400).json({ 
                    success: false, 
                    error: "El nombre del establecimiento y dirección son obligatorios" 
                });
            }

            const data = {
                nombre_establecimiento: nombre_establecimiento.trim(),
                direccion: direccion.trim(),
                documento: documento ? documento.trim() : null,
                razon_social: razon_social ? razon_social.trim() : null,
                celular: celular ? celular.trim() : null,
                ciudad: ciudad ? ciudad.trim() : null
            };

            const success = await Store.update(storeId, data);
            
            if (!success) {
                return res.status(404).json({ success: false, error: "Tienda no encontrada o no se pudo actualizar" });
            }

            // Retrieve updated store info
            const updatedStore = await Store.findById(storeId);

            res.json({
                success: true,
                message: "Información de la tienda actualizada correctamente",
                tienda: updatedStore
            });
        } catch (error) {
            console.error('Error actualizando información de tienda:', error);
            res.status(500).json({ success: false, error: "Error interno del servidor al actualizar tienda" });
        }
    }

    static async toggleStoreStatus(req, res) {
        try {
            if (!req.session.userId) {
                return res.status(401).json({ success: false, error: "No autenticado" });
            }

            const storeId = parseInt(req.params.id);
            if (!storeId) {
                return res.status(400).json({ success: false, error: "ID inválido" });
            }

            // 🛡️ IDOR: Verificar que la tienda es la del usuario
            if (!verifyStoreOwnership(storeId, req.session.tiendaId)) {
                return res.status(403).json({ success: false, error: "No autorizado para esta tienda" });
            }

            const result = await Store.toggleStatus(storeId);
            
            if (!result.success) {
                return res.status(404).json({ success: false, error: "Tienda no encontrada" });
            }

            res.json({
                success: true,
                message: `Estado actualizado a: ${result.nuevoEstado}`,
                nuevoEstado: result.nuevoEstado
            });
        } catch (error) {
            console.error('Error cambiando estado de tienda:', error);
            res.status(500).json({ success: false, error: safeError(error, 'Error interno del servidor') });
        }
    }
}

module.exports = StoreController;