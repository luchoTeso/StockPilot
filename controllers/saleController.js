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

            // Iniciar transacción de BD (Patrón Postgres Client)
            const client = await db.getClient();

            try {
                await client.query('BEGIN');

                // 1. Obtener información del producto DENTRO de la transacción
                const prodResult = await client.query('SELECT cantidad, precio FROM Productos WHERE id_producto = ?', [id_producto]);
                const producto = prodResult.rows[0];
                
                if (!producto) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ success: false, error: "Producto no encontrado" });
                }

                if (producto.cantidad < cantidad) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ success: false, error: "Stock insuficiente para la venta" });
                }

                const total = producto.precio * cantidad;

                // 2. Registrar la venta principal (Sale.create debe adaptarse o usarse el client)
                // Para mantener la consistencia de la transacción, usaremos el client directamente aquí
                const saleInsert = await client.query(
                    `INSERT INTO Ventas (id_vendedor, id_tienda, precio_total, fecha_salida) 
                     VALUES (?, ?, ?, CURRENT_TIMESTAMP) RETURNING id_venta`,
                    [id_vendedor, id_tienda, total]
                );
                const id_venta = saleInsert.rows[0].id_venta;

                // 3. Registrar detalle de venta
                await client.query(
                    `INSERT INTO VentasProductos (id_venta, id_producto, cantidad) VALUES (?, ?, ?)`,
                    [id_venta, id_producto, cantidad]
                );

                // 4. Descontar stock Y registrar movimiento
                const stockFinalResult = producto.cantidad - cantidad;

                // Descontar del producto
                await client.query('UPDATE Productos SET cantidad = ? WHERE id_producto = ?', [stockFinalResult, id_producto]);

                // Registrar movimiento con saldo final
                // printf -> LPAD en Postgres
                await client.query(
                    `INSERT INTO MovimientosStock (id_producto, tipo_movimiento, cantidad, stock_final, fecha_movimiento, observacion, id_usuario, id_tienda)
                     VALUES (?, 'Salida', ?, ?, CURRENT_TIMESTAMP, 'Venta #' || LPAD(?::text, 6, '0'), ?, ?)`,
                    [id_producto, cantidad, stockFinalResult, id_venta, id_vendedor, id_tienda]
                );

                await client.query('COMMIT');
                res.json({ success: true, message: "Venta procesada y stock actualizado" });

            } catch (txError) {
                await client.query('ROLLBACK');
                throw txError;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Error en proceso de venta:', error);
            res.status(500).json({ success: false, error: "Error interno procesando la transacción" });
        }
    }
}

module.exports = SaleController;