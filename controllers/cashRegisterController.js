const CashRegister = require('../models/CashRegister');

class CashRegisterController {
    static async getCurrentSession(req, res) {
        try {
            const id_tienda = req.session.tiendaId;
            const id_vendedor = req.session.userId;
            
            const session = await CashRegister.getCurrentSession(id_tienda, id_vendedor);
            
            if (session) {
                res.json({ active: true, session });
            } else {
                res.json({ active: false });
            }
        } catch (error) {
            console.error('Error fetching cash register session:', error);
            res.status(500).json({ error: 'Error interno del servidor al verificar caja' });
        }
    }

    static async openSession(req, res) {
        try {
            const id_tienda = req.session.tiendaId;
            const id_vendedor = req.session.userId;
            const { monto_apertura } = req.body;

            // Verificar que no haya una caja abierta ya
            const activeSession = await CashRegister.getCurrentSession(id_tienda, id_vendedor);
            if (activeSession) {
                return res.status(400).json({ error: 'Ya tienes una sesión de caja abierta.' });
            }

            if (monto_apertura === undefined || monto_apertura < 0) {
                return res.status(400).json({ error: 'El monto de apertura no es válido.' });
            }

            const result = await CashRegister.openSession(id_tienda, id_vendedor, monto_apertura);
            res.json({ success: true, message: 'Caja abierta exitosamente', id_sesion: result.id_sesion });
        } catch (error) {
            console.error('Error opening cash register session:', error);
            res.status(500).json({ error: 'Error al abrir la caja' });
        }
    }

    static async closeSession(req, res) {
        try {
            const id_tienda = req.session.tiendaId;
            const id_vendedor = req.session.userId;
            const { monto_cierre_declarado } = req.body;

            // Buscar sesión activa
            const activeSession = await CashRegister.getCurrentSession(id_tienda, id_vendedor);
            if (!activeSession) {
                return res.status(400).json({ error: 'No hay ninguna caja abierta para cerrar.' });
            }

            if (monto_cierre_declarado === undefined || monto_cierre_declarado < 0) {
                return res.status(400).json({ error: 'El monto de cierre declarado no es válido.' });
            }

            const arqueo = await CashRegister.closeSession(activeSession.id_sesion, monto_cierre_declarado);
            res.json({ success: true, message: 'Caja cerrada exitosamente (Arqueo completo)', arqueo });
        } catch (error) {
            console.error('Error closing cash register session:', error);
            res.status(500).json({ error: 'Error al cerrar la caja' });
        }
    }

    static async getHistory(req, res) {
        try {
            const id_tienda = req.session.tiendaId;
            const history = await CashRegister.getSessionsHistory(id_tienda);
            res.json({ success: true, history });
        } catch (error) {
            console.error('Error fetching cash register history:', error);
            res.status(500).json({ error: 'Error al obtener el historial de caja' });
        }
    }
}

module.exports = CashRegisterController;
