const db = require('../config/database');

class CashRegister {
    /**
     * Verifica si hay una sesión abierta para el vendedor actual en la tienda actual
     */
    static async getCurrentSession(id_tienda, id_vendedor) {
        return await db.getAsync(
            `SELECT * FROM SesionCaja 
             WHERE id_tienda = ? AND id_vendedor = ? AND LOWER(estado) = 'abierta' 
             ORDER BY fecha_apertura DESC LIMIT 1`,
            [id_tienda, id_vendedor]
        );
    }

    /**
     * Abre una nueva sesión de caja
     */
    static async openSession(id_tienda, id_vendedor, monto_apertura) {
        return await db.runAsync(
            `INSERT INTO SesionCaja (id_tienda, id_vendedor, monto_apertura, estado) 
             VALUES (?, ?, ?, 'Abierta') RETURNING id_sesion`,
            [id_tienda, id_vendedor, monto_apertura]
        );
    }

    /**
     * Calcula las ventas en efectivo realizadas durante la sesión actual
     */
    static async getSessionSalesAmount(id_sesion) {
        const result = await db.getAsync(
            `SELECT COALESCE(SUM(precio_total), 0) as total_ventas 
             FROM Ventas 
             WHERE id_sesion_caja = ? AND metodo_pago = 'Efectivo'`,
            [id_sesion]
        );
        return parseFloat(result.total_ventas || 0);
    }

    /**
     * Cierra la sesión de caja comparando lo declarado vs calculado
     */
    static async closeSession(id_sesion, monto_cierre_declarado) {
        // 1. Obtener la sesión
        const sesion = await db.getAsync(`SELECT * FROM SesionCaja WHERE id_sesion = ?`, [id_sesion]);
        if (!sesion) throw new Error("Sesión no encontrada");
        if (sesion.estado === 'Cerrada') throw new Error("La sesión ya está cerrada");

        // 2. Calcular total esperado (Apertura + Ventas en efectivo)
        const ventas_efectivo = await this.getSessionSalesAmount(id_sesion);
        const monto_apertura = parseFloat(sesion.monto_apertura || 0);
        const monto_cierre_calculado = monto_apertura + ventas_efectivo;
        
        // 3. Diferencia
        const diferencia = parseFloat(monto_cierre_declarado) - monto_cierre_calculado;

        // 4. Actualizar estado
        await db.runAsync(
            `UPDATE SesionCaja 
             SET monto_cierre_declarado = ?, 
                 monto_cierre_calculado = ?, 
                 diferencia = ?, 
                 fecha_cierre = CURRENT_TIMESTAMP, 
                 estado = 'Cerrada'
             WHERE id_sesion = ?`,
            [monto_cierre_declarado, monto_cierre_calculado, diferencia, id_sesion]
        );

        return {
            monto_apertura,
            ventas_efectivo,
            monto_cierre_calculado,
            monto_cierre_declarado,
            diferencia
        };
    }

    /**
     * Obtiene el historial de sesiones de caja de una tienda
     */
    static async getSessionsHistory(id_tienda) {
        return await db.allAsync(
            `SELECT s.*, u.nombres as vendedor_nombre 
             FROM SesionCaja s
             LEFT JOIN Usuarios u ON s.id_vendedor = u.id_usuario
             WHERE s.id_tienda = ? 
             ORDER BY s.fecha_apertura DESC`,
            [id_tienda]
        );
    }
}

module.exports = CashRegister;
