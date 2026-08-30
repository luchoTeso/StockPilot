// models/Sale.js
const db = require('../config/database');

class Sale {
    static async create(saleData) {
        const { id_vendedor, id_tienda, precio_total } = saleData;
        
        const query = `
            INSERT INTO Ventas (id_vendedor, id_tienda, precio_total, fecha_salida)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `;
        const result = await db.runAsync(query, [id_vendedor, id_tienda, precio_total]);
        return result.lastID;
    }

    static async createSaleProduct(saleProductData) {
        const { id_venta, id_producto, cantidad, precio_unitario } = saleProductData;
        
        const query = `
            INSERT INTO VentasProductos (id_venta, id_producto, cantidad, precio_unitario)
            VALUES (?, ?, ?, ?)
        `;
        await db.runAsync(query, [id_venta, id_producto, cantidad, precio_unitario]);
    }

    /**
     * Buscar ventas con paginación y límite
     */
    static async findByStore(storeId, limit = 100, offset = 0) {
        const query = `
            SELECT 
                v.id_venta,
                v.fecha_salida,
                vp.cantidad,
                p.nombre_producto,
                p.categoria,
                v.precio_total
            FROM Ventas v
            JOIN VentasProductos vp ON vp.id_venta = v.id_venta
            JOIN Productos p ON p.id_producto = vp.id_producto
            WHERE v.id_tienda = ?
            ORDER BY v.fecha_salida DESC
            LIMIT ? OFFSET ?
        `;
        return await db.allAsync(query, [storeId, limit, offset]);
    }

    /**
     * Contar total de registros de ventas (para paginación)
     */
    static async countByStore(storeId) {
        const query = `
            SELECT COUNT(*) AS total
            FROM Ventas v
            JOIN VentasProductos vp ON vp.id_venta = v.id_venta
            WHERE v.id_tienda = ?
        `;
        const row = await db.getAsync(query, [storeId]);
        return parseInt(row.total || 0, 10);
    }

    /**
     * Estadísticas calculadas directamente con SQL (mucho más rápido)
     */
    static async getSalesStats(storeId) {
        const query = `
            SELECT 
                COALESCE(SUM(v.precio_total), 0) AS totalVentas,
                COALESCE(SUM(vp.cantidad), 0) AS totalProductos,
                COALESCE(AVG(v.precio_total), 0) AS ventaPromedio,
                COUNT(DISTINCT p.id_producto) AS productosUnicos
            FROM Ventas v
            JOIN VentasProductos vp ON vp.id_venta = v.id_venta
            JOIN Productos p ON p.id_producto = vp.id_producto
            WHERE v.id_tienda = ?
        `;
        const stats = await db.getAsync(query, [storeId]);
        // PostgreSQL normaliza aliases sin comillas a minúsculas; convertir a número
        // porque SUM/AVG/COUNT devuelven string en node-postgres
        return {
            totalVentas: Number(stats.totalventas || 0),
            totalProductos: Number(stats.totalproductos || 0),
            ventaPromedio: Math.round(Number(stats.ventapromedio || 0) * 100) / 100,
            productosUnicos: Number(stats.productosunicos || 0)
        };
    }

    /**
     * Crear índices para acelerar queries
     */
    static async ensureIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_ventas_tienda ON Ventas(id_tienda)',
            'CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON Ventas(fecha_salida)',
            'CREATE INDEX IF NOT EXISTS idx_vp_venta ON VentasProductos(id_venta)',
            'CREATE INDEX IF NOT EXISTS idx_vp_producto ON VentasProductos(id_producto)',
            'CREATE INDEX IF NOT EXISTS idx_productos_tienda ON Productos(id_tienda)',
            'CREATE INDEX IF NOT EXISTS idx_mov_producto ON MovimientosStock(id_producto)',
            'CREATE INDEX IF NOT EXISTS idx_mov_tienda ON MovimientosStock(id_tienda)',
        ];
        await Promise.all(indexes.map(sql => db.runAsync(sql)));
    }
}

module.exports = Sale;