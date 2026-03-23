// controllers/tendederoController.js
const User = require('../models/User');

class TendederoController {
    static async getTendederos(req, res) {
        try {
            const tiendaId = req.session.tiendaId;

            if (!tiendaId) {
                return res.status(400).json({ success: false, error: "No se pudo identificar la tienda" });
            }

            const tendederos = await User.findTendederosByStore(tiendaId);
            res.json(tendederos);
        } catch (error) {
            console.error('Error obteniendo tendederos:', error);
            res.status(500).json({ success: false, error: "Error obteniendo tendederos" });
        }
    }

    static async createTendedero(req, res) {
        try {
            const { nombres, genero, correo, celular, usuario, contrasena } = req.body;
            const id_tienda = req.session.tiendaId;

            if (!id_tienda) {
                return res.status(400).json({ success: false, error: "No se pudo obtener la tienda del usuario" });
            }

            if (!nombres || !usuario || !contrasena || !correo) {
                return res.status(400).json({ success: false, error: "Faltan campos obligatorios" });
            }

            const userData = {
                nombres,
                genero,
                correo,
                celular,
                usuario,
                contrasena, // bcrypt se aplica dentro de User.create()
                rol: 'Tendedero',
                id_tienda
            };

            const userId = await User.create(userData);
            res.json({ success: true, id_usuario: userId });
        } catch (error) {
            console.error('Error creando tendedero:', error);
            
            if (error.message && error.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ success: false, error: "El correo o usuario ya existe" });
            }
            
            res.status(500).json({ success: false, error: "Error registrando tendedero" });
        }
    }

    static async updateTendedero(req, res) {
        try {
            const tendederoId = req.params.id;
            const { nombres, genero, correo, celular, usuario } = req.body;

            const success = await User.update(tendederoId, {
                nombres, genero, correo, celular, usuario
            });

            if (!success) {
                return res.status(404).json({ success: false, error: "Tendedero no encontrado" });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Error actualizando tendedero:', error);
            res.status(500).json({ success: false, error: "Error actualizando tendedero" });
        }
    }

    static async deleteTendedero(req, res) {
        try {
            const tendederoId = req.params.id;
            const tiendaId = req.session.tiendaId;

            const success = await User.delete(tendederoId, tiendaId);

            if (!success) {
                return res.status(404).json({ success: false, error: "Tendedero no encontrado" });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Error eliminando tendedero:', error);
            res.status(500).json({ success: false, error: "Error eliminando tendedero" });
        }
    }
}

module.exports = TendederoController;