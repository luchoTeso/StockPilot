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

            if (!id_vendedor) {
                return res.status(401).json({ success: false, error: "No autenticado" });
            }

            // 1. Obtener información del producto
            const producto = await Product.findById(id_producto);
            if (!producto) {
                return res.status(400).json({ success: false, error: "Producto no encontrado" });
            }

            if (producto.cantidad < cantidad) {
                return res.status(400).json({ success: false, error: "Inventario insuficiente" });
            }

            const total = producto.precio * cantidad;

            // Fix #6: Envolver en transacción SQL
            await db.runAsync('BEGIN TRANSACTION');

            try {
                // 2. Registrar la venta
                const saleData = {
                    id_vendedor,
                    id_tienda,
                    precio_total: total
                };
                const id_venta = await Sale.create(saleData);

                // 3. Registrar detalle de venta
                await Sale.createSaleProduct({
                    id_venta,
                    id_producto,
                    cantidad
                });

                // 4. Descontar stock
                await Product.addStock(id_producto, -cantidad);

                await db.runAsync('COMMIT');
                res.json({ success: true, message: "Venta registrada con éxito" });
            } catch (txError) {
                await db.runAsync('ROLLBACK');
                throw txError;
            }

        } catch (error) {
            console.error('Error registrando venta:', error);
            res.status(500).json({ success: false, error: "Error registrando venta" });
        }
    }
}

module.exports = SaleController;