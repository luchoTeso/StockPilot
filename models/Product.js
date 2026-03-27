// models/Product.js
const db = require('../config/database');

class Product {
    static async findByStore(storeId) {
        // Mejorado: Ahora incluye la velocidad de venta de los últimos 30 días
        const query = `
            SELECT 
                p.*,
                IFNULL(
                  (SELECT SUM(vp2.cantidad) 
                   FROM VentasProductos vp2 
                   JOIN Ventas v2 ON vp2.id_venta = v2.id_venta 
                   WHERE vp2.id_producto = p.id_producto 
                   AND v2.fecha_salida >= DATE('now', '-30 days')
                  ), 0) / 30.0 as velocity
            FROM Productos p 
            WHERE p.id_tienda = ? 
            ORDER BY nombre_producto
        `;
        return await db.allAsync(query, [storeId]);
    }

    static async findById(productId) {
        const query = `SELECT * FROM Productos WHERE id_producto = ?`;
        return await db.getAsync(query, [productId]);
    }

    static async create(productData) {
        const query = `
            INSERT INTO Productos (
                codigo, nombre_producto, categoria, subcategoria, tipo_producto,
                precio, cantidad, fecha_entrada, estado, id_tienda,
                stock_minimo, stock_maximo, fecha_vencimiento, frecuencia_compra_dias, costo_compra,
                stock_seguridad, lead_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, 'Disponible', ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await db.runAsync(query, [
            productData.codigo,
            productData.nombre_producto,
            productData.categoria,
            productData.subcategoria,
            productData.tipo_producto,
            productData.precio,
            productData.cantidad,
            productData.id_tienda,
            productData.stock_minimo,
            productData.stock_maximo || 200,
            productData.fecha_vencimiento || null,
            productData.frecuencia_compra_dias,
            productData.costo_compra || 0,
            productData.stock_seguridad,
            productData.lead_time
        ]);
        return result.lastID;
    }

    static async update(productId, productData) {
        const query = `
            UPDATE Productos SET
            codigo = ?, nombre_producto = ?, categoria = ?, subcategoria = ?,
            tipo_producto = ?, precio = ?, cantidad = ?,
            stock_minimo = ?, stock_maximo = ?, fecha_vencimiento = ?,
            frecuencia_compra_dias = ?, costo_compra = ?,
            stock_seguridad = ?, lead_time = ?
            WHERE id_producto = ?
        `;
        const result = await db.runAsync(query, [
            productData.codigo,
            productData.nombre_producto,
            productData.categoria,
            productData.subcategoria,
            productData.tipo_producto,
            productData.precio,
            productData.cantidad,
            productData.stock_minimo || 5,
            productData.stock_maximo || 200,
            productData.fecha_vencimiento || null,
            productData.frecuencia_compra_dias || 7,
            productData.costo_compra || 0,
            productData.stock_seguridad || 0,
            productData.lead_time || 3,
            productId
        ]);
        return result.changes > 0;
    }

    static async addStock(productId, cantidad) {
        const query = `
            UPDATE Productos SET cantidad = cantidad + ?, fecha_entrada = CURRENT_DATE
            WHERE id_producto = ?
        `;
        const result = await db.runAsync(query, [cantidad, productId]);
        return result.changes > 0;
    }

    static async toggleStatus(productId, estado) {
        const query = `UPDATE Productos SET estado = ? WHERE id_producto = ?`;
        const result = await db.runAsync(query, [estado, productId]);
        return result.changes > 0;
    }

    static async delete(productId) {
        const query = `DELETE FROM Productos WHERE id_producto = ?`;
        const result = await db.runAsync(query, [productId]);
        return result.changes > 0;
    }

    /**
     * Productos con stock por debajo del mínimo
     */
    static async findBelowMinStock(storeId) {
        const query = `
            SELECT * FROM Productos 
            WHERE id_tienda = ? AND cantidad < stock_minimo AND estado = 'Disponible'
            ORDER BY (cantidad * 1.0 / stock_minimo) ASC
        `;
        return await db.allAsync(query, [storeId]);
    }

    /**
     * Productos próximos a vencer en N días
     */
    static async findExpiringByStore(storeId, days = 7) {
        const query = `
            SELECT *, 
                CAST(julianday(fecha_vencimiento) - julianday('now') AS INTEGER) AS dias_para_vencer
            FROM Productos 
            WHERE id_tienda = ? 
              AND fecha_vencimiento IS NOT NULL 
              AND fecha_vencimiento != ''
              AND julianday(fecha_vencimiento) - julianday('now') <= ?
              AND julianday(fecha_vencimiento) - julianday('now') >= 0
              AND estado = 'Disponible'
            ORDER BY fecha_vencimiento ASC
        `;
        return await db.allAsync(query, [storeId, days]);
    }

    /**
     * Motor de Decisión (Fase 2 Pro):
     * Encuentra alertas basadas en ROP (Reorder Point) y Stock de Seguridad
     */
    static async findProAlerts(storeId) {
        const query = `
            WITH VelocityData AS (
                SELECT 
                    p.id_producto,
                    p.nombre_producto,
                    p.cantidad as stock_actual,
                    p.stock_seguridad,
                    p.lead_time,
                    IFNULL(
                        (SELECT SUM(vp2.cantidad) 
                         FROM VentasProductos vp2 
                         JOIN Ventas v2 ON vp2.id_venta = v2.id_venta 
                         WHERE vp2.id_producto = p.id_producto 
                         AND v2.fecha_salida >= DATE('now', '-30 days')
                        ), 0) / 30.0 as velocity
                FROM Productos p
                WHERE p.id_tienda = ? AND p.estado = 'Disponible'
            )
            SELECT 
                *,
                (velocity * lead_time) + stock_seguridad as rop
            FROM VelocityData
            WHERE stock_actual <= (velocity * lead_time) + stock_seguridad
            ORDER BY stock_actual ASC
        `;
        const rows = await db.allAsync(query, [storeId]);
        
        return rows.map(r => {
            let nivel = 'warning'; // Reposición
            let mensaje = `Punto de reorden alcanzado (${Math.round(r.rop)} u). Sugerido pedir pronto.`;

            if (r.stock_actual <= r.stock_seguridad) {
                nivel = 'critical';
                mensaje = `STOCK CRÍTICO: Por debajo de reserva de seguridad (${r.stock_seguridad} u). ¡Riesgo de quiebre!`;
            }

            return { ...r, nivel, mensaje };
        });
    }
}

module.exports = Product;