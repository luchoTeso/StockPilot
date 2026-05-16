/**
 * @file InventoryMovement.js
 * @description Modelo para la gestión y registro histórico de movimientos de inventario.
 * Centraliza la lógica de actualización de stock y mantiene la trazabilidad de cada 
 * entrada, salida y ajuste manual en la base de datos.
 * 
 * @module models/InventoryMovement
 */

const db = require('../config/database');

/**
 * Clase InventoryMovement
 * Provee métodos estáticos para interactuar con la tabla MovimientosStock.
 */
class InventoryMovement {
    /**
     * Registra un nuevo movimiento de inventario (Entrada, Salida o Ajuste).
     * Este método es transaccional en su lógica: valida existencias, calcula el nuevo saldo
     * y actualiza la tabla de Productos sincronizadamente.
     * 
     * @async
     * @function create
     * @param {Object} data - Datos del movimiento.
     * @param {number} data.id_producto - ID del producto afectado.
     * @param {('Entrada'|'Salida'|'Ajuste')} data.tipo_movimiento - Tipo de alteración de stock.
     * @param {number} data.cantidad - Unidades a mover (debe ser positiva, el tipo define el signo).
     * @param {string} [data.observacion] - Nota aclaratoria sobre el movimiento.
     * @param {number} data.id_usuario - ID del usuario responsable.
     * @param {number} data.id_tienda - ID de la tienda donde ocurre el movimiento.
     * @returns {Promise<Object>} Resultado de la operación con stock anterior y nuevo saldo.
     * @throws {Error} Si el stock es insuficiente o el tipo de movimiento no es válido.
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

        const result = await db.runAsync(
            `INSERT INTO MovimientosStock (id_producto, tipo_movimiento, cantidad, stock_final, fecha_movimiento, observacion, id_usuario, id_tienda)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`,
            [id_producto, tipo_movimiento, cantidad, nuevoStock, observacion || '', id_usuario, id_tienda]
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

     * Obtiene el historial de movimientos detallado para un producto específico.
     * Incluye información del usuario que realizó cada acción.
     * 
     * @async
     * @function findByProduct
     * @param {number} productId - Identificador del producto.
     * @param {number} [limit=50] - Cantidad máxima de registros a retornar.
     * @returns {Promise<Array<Object>>} Lista de movimientos ordenados por fecha descendente.
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

     * Consulta movimientos de inventario a nivel de tienda con capacidades de filtrado avanzado.
     * Permite auditorías por tipo de movimiento, fechas y producto específico.
     * 
     * @async
     * @function findByStore
     * @param {number} storeId - ID de la tienda.
     * @param {Object} [filters={}] - Criterios de filtrado.
     * @param {string} [filters.tipo] - Filtrar por 'Entrada', 'Salida' o 'Ajuste'.
     * @param {string} [filters.fechaDesde] - Fecha inicial en formato YYYY-MM-DD.
     * @param {string} [filters.fechaHasta] - Fecha final en formato YYYY-MM-DD.
     * @param {number} [filters.productoId] - Filtrar por un solo producto.
     * @returns {Promise<Array<Object>>} Lista de movimientos que cumplen los criterios.
     */
    static async findByStore(storeId, filters = {}) {
        let query = `
            SELECT ms.*, p.nombre_producto, p.categoria, u.nombres AS nombre_usuario
            FROM MovimientosStock ms
            JOIN Productos p ON p.id_producto = ms.id_producto
            LEFT JOIN Usuarios u ON u.id_usuario = ms.id_usuario
            WHERE ms.id_tienda = ?
            AND ms.observacion NOT LIKE 'Venta #%'
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
     * Obtiene un resumen estadístico de los movimientos de un producto.
     * Útil para análisis de rotación y auditoría de ajustes.
     * 
     * @async
     * @function getSummaryByProduct
     * @param {number} productId - ID del producto.
     * @returns {Promise<Array<Object>>} Resumen con totales por tipo de movimiento.
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
     * Genera un resumen global de todos los movimientos registrados en la tienda.
     * Provee una visión macro del flujo de mercancía (Entradas vs Salidas).
     * 
     * @async
     * @function getStoreSummary
     * @param {number} storeId - ID de la tienda.
     * @returns {Promise<Array<Object>>} Totales agregados por tipo de movimiento.
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
