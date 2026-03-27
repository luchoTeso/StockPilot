/**
 * @file saleController.js
 * @description Controlador para la gestión de ventas y movimientos de inventario.
 * Implementa lógica de transacciones atómicas para garantizar la integridad del stock
 * y la trazabilidad completa mediante MovimientosStock.
 * 
 * @module controllers/saleController
 */

const Sale = require('../models/Sale');
const Product = require('../models/Product');
const db = require('../config/database');

/**
 * Sale Controller
 * Gestiona el ciclo de vida de una venta: validación, registro y actualización de inventario.
 */
class SaleController {
  /**
   * Obtiene la lista de ventas de una tienda con paginación.
   * 
   * @async
   * @function getSales
   * @param {import('express').Request} req - Objeto de petición Express.
   * @param {import('express').Response} res - Objeto de respuesta Express.
   */
  static async getSales(req, res) {
        try {
            const id_tienda = req.session.tiendaId;
            const limit = parseInt(req.query.limit) || 100;
            const offset = parseInt(req.query.offset) || 0;

            const [ventas, total] = await Promise.all([
                Sale.findByStore(id_tienda, limit, offset),
                Sale.countByStore(id_tienda)
            ]);

            res.json({
                data: ventas,
                total: total,
                limit: limit,
                offset: offset,
                hasMore: offset + limit < total
            });
        } catch (error) {
            console.error('Error obteniendo ventas:', error);
            res.status(500).json({ success: false, error: "Error consultando ventas" });
        }
    }

    /**
     * Obtiene estadísticas agregadas de ventas para la tienda actual.
     * 
     * @async
     * @function getSalesStats
     * @param {import('express').Request} req - Objeto de petición Express.
     * @param {import('express').Response} res - Objeto de respuesta Express.
     */
    static async getSalesStats(req, res) {
        try {
            const id_tienda = req.session.tiendaId;
            const stats = await Sale.getSalesStats(id_tienda);
            res.json(stats);
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({ success: false, error: "Error obteniendo estadísticas" });
        }
    }

    /**
     * Registra una nueva venta de forma atómica.
     * Realiza validación de stock, creación de registro de venta, detalle de productos
     * y actualización de inventario dentro de una sola transacción de base de datos.
     * 
     * @async
     * @function registerSale
     * @param {import('express').Request} req - Objeto de petición Express. Debe contener id_producto y cantidad.
     * @param {import('express').Response} res - Objeto de respuesta Express.
     * @returns {Promise<void>}
     */
    static async registerSale(req, res) {
        try {
            const { id_producto, cantidad } = req.body;
            const id_vendedor = req.session.userId;
            const id_tienda = req.session.tiendaId;

            if (!id_vendedor || !id_tienda) {
                return res.status(401).json({ success: false, error: "Sesión no válida" });
            }

            // Iniciar transacción de BD
            await db.runAsync('BEGIN TRANSACTION');

            try {
                // 1. Obtener información del producto DENTRO de la transacción (bloqueo ligero de SQLite)
                const producto = await db.getAsync('SELECT cantidad, precio FROM Productos WHERE id_producto = ?', [id_producto]);
                
                if (!producto) {
                    await db.runAsync('ROLLBACK');
                    return res.status(404).json({ success: false, error: "Producto no encontrado" });
                }

                if (producto.cantidad < cantidad) {
                    await db.runAsync('ROLLBACK');
                    return res.status(400).json({ success: false, error: "Stock insuficiente para la venta" });
                }

                const total = producto.precio * cantidad;

                // 2. Registrar la venta principal
                const id_venta = await Sale.create({
                    id_vendedor,
                    id_tienda,
                    precio_total: total
                });

                // 3. Registrar detalle de venta (con precio histórico)
                await Sale.createSaleProduct({
                    id_venta,
                    id_producto,
                    cantidad,
                    precio_unitario: producto.precio
                });

                // 4. Descontar stock Y registrar movimiento (Trazabilidad completa)
                const stockFinalResult = producto.cantidad - cantidad;

                // Descontar del producto
                await db.runAsync('UPDATE Productos SET cantidad = ? WHERE id_producto = ?', [stockFinalResult, id_producto]);

                // Registrar movimiento con saldo final
                await db.runAsync(
                    `INSERT INTO MovimientosStock (id_producto, tipo_movimiento, cantidad, stock_final, fecha_movimiento, observacion, id_usuario, id_tienda)
                     VALUES (?, 'Salida', ?, ?, CURRENT_TIMESTAMP, 'Venta #' || printf('%06d', ?), ?, ?)`,
                    [id_producto, cantidad, stockFinalResult, id_venta, id_vendedor, id_tienda]
                );

                await db.runAsync('COMMIT');
                res.json({ success: true, message: "Venta procesada y stock actualizado" });

            } catch (txError) {
                await db.runAsync('ROLLBACK');
                throw txError;
            }

        } catch (error) {
            console.error('Error en proceso de venta:', error);
            res.status(500).json({ success: false, error: "Error interno procesando la transacción" });
        }
    }
}

module.exports = SaleController;