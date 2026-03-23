// models/InventoryMovement.js
const db = require('../config/database');

class InventoryMovement {
    /**
     * Registrar un movimiento de inventario (Entrada, Salida, Ajuste)
     * Actualiza automáticamente el stock del producto
     */
    static async create(data) {
        const { id_producto, tipo_movimiento, cantidad, observacion, id_usuario, id_tienda } = data;

        // Validar tipo
        const tiposValidos = ['Entrada', 'Salida', 'Ajuste'];
        if (!tiposValidos.includes(tipo_movimiento)) {
            throw new Error('Tipo de movimiento no válido. Use: Entrada, Salida o Ajuste');
        }

        // Obtener stock actual
        const producto = await db.getAsync('SELECT cantidad, nombre_producto FROM Productos WHERE id_producto = ?', [id_producto]);
        if (!producto) {
            throw new Error('Producto no encontrado');
        }

        // Calcular nuevo stock
        let nuevoStock;
        if (tipo_movimiento === 'Entrada') {
            nuevoStock = producto.cantidad + cantidad;
        } else if (tipo_movimiento === 'Salida') {
            if (cantidad > producto.cantidad) {
                throw new Error(`Stock insuficiente. Disponible: ${producto.cantidad}, solicitado: ${cantidad}`);
            }
            nuevoStock = producto.cantidad - cantidad;
        } else {
            // Ajuste: la cantidad puede ser positiva o negativa
            nuevoStock = producto.cantidad + cantidad;
            if (nuevoStock < 0) nuevoStock = 0;
        }

        // Insertar movimiento con fecha/hora local del servidor
        const now = new Date();
        const ahora = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        const result = await db.runAsync(
            `INSERT INTO MovimientosStock (id_producto, tipo_movimiento, cantidad, fecha_movimiento, observacion, id_usuario, id_tienda)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id_producto, tipo_movimiento, cantidad, ahora, observacion || '', id_usuario, id_tienda]
        );

        // Actualizar stock del producto
        await db.runAsync(
            'UPDATE Productos SET cantidad = ? WHERE id_producto = ?',
            [nuevoStock, id_producto]
        );

        return {
            id: result.lastID,
            producto: producto.nombre_producto,
            tipo: tipo_movimiento,
            cantidad,
            stockAnterior: producto.cantidad,
            stockNuevo: nuevoStock,
        };
    }

    /**
     * Historial de movimientos de un producto
     */
    static async findByProduct(productId, limit = 50) {
        const query = `
            SELECT ms.*, p.nombre_producto, u.nombres AS nombre_usuario
            FROM MovimientosStock ms
            JOIN Productos p ON p.id_producto = ms.id_producto
            LEFT JOIN Usuarios u ON u.id_usuario = ms.id_usuario
            WHERE ms.id_producto = ?
            ORDER BY ms.fecha_movimiento DESC
            LIMIT ?
        `;
        return await db.allAsync(query, [productId, limit]);
    }

    /**
     * Historial de movimientos de una tienda con filtros
     */
    static async findByStore(storeId, filters = {}) {
        let query = `
            SELECT ms.*, p.nombre_producto, p.categoria, u.nombres AS nombre_usuario
            FROM MovimientosStock ms
            JOIN Productos p ON p.id_producto = ms.id_producto
            LEFT JOIN Usuarios u ON u.id_usuario = ms.id_usuario
            WHERE ms.id_tienda = ?
        `;
        const params = [storeId];

        if (filters.tipo) {
            query += ' AND ms.tipo_movimiento = ?';
            params.push(filters.tipo);
        }

        if (filters.fechaDesde) {
            query += ' AND ms.fecha_movimiento >= ?';
            params.push(filters.fechaDesde);
        }

        if (filters.fechaHasta) {
            query += ' AND ms.fecha_movimiento <= ?';
            params.push(filters.fechaHasta + ' 23:59:59');
        }

        if (filters.productoId) {
            query += ' AND ms.id_producto = ?';
            params.push(filters.productoId);
        }

        query += ' ORDER BY ms.fecha_movimiento DESC LIMIT 200';

        return await db.allAsync(query, params);
    }

    /**
     * Resumen de movimientos por producto
     */
    static async getSummaryByProduct(productId) {
        const query = `
            SELECT 
                tipo_movimiento,
                SUM(cantidad) AS total_cantidad,
                COUNT(*) AS total_movimientos
            FROM MovimientosStock
            WHERE id_producto = ?
            GROUP BY tipo_movimiento
        `;
        return await db.allAsync(query, [productId]);
    }

    /**
     * Resumen general de movimientos de la tienda
     */
    static async getStoreSummary(storeId) {
        const query = `
            SELECT 
                tipo_movimiento,
                SUM(cantidad) AS total_cantidad,
                COUNT(*) AS total_movimientos
            FROM MovimientosStock
            WHERE id_tienda = ?
            GROUP BY tipo_movimiento
        `;
        return await db.allAsync(query, [storeId]);
    }
}

module.exports = InventoryMovement;
