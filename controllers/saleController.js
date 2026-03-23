// controllers/saleController.js
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const db = require('../config/database');

class SaleController {
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

                // 3. Registrar detalle de venta
                await Sale.createSaleProduct({
                    id_venta,
                    id_producto,
                    cantidad
                });

                // 4. Descontar stock Y registrar movimiento (Trazabilidad completa)
                // Usamos SQL directo aquí para mantener la misma transacción abierta
                const now = new Date();
                const ahora = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
                
                await db.runAsync(
                    'UPDATE Productos SET cantidad = cantidad - ? WHERE id_producto = ?',
                    [cantidad, id_producto]
                );

                await db.runAsync(
                    `INSERT INTO MovimientosStock (id_producto, tipo_movimiento, cantidad, fecha_movimiento, observacion, id_usuario, id_tienda)
                     VALUES (?, 'Salida', ?, ?, 'Venta registrada (ID: ' || ?, ?, ?)`,
                    [id_producto, cantidad, ahora, id_venta, id_vendedor, id_tienda]
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