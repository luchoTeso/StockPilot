// utils/securityUtils.js
// Utilidades de seguridad centralizadas para StockPilot

const db = require('../config/database');

/**
 * Devuelve un mensaje de error seguro para el cliente.
 * En producción: mensaje genérico. En desarrollo: mensaje real del error.
 * @param {Error} error - El error original capturado
 * @param {string} [fallback='Error interno del servidor'] - Mensaje genérico para producción
 * @returns {string} Mensaje seguro para enviar al cliente
 */
function safeError(error, fallback = 'Error interno del servidor') {
    if (process.env.NODE_ENV === 'production') {
        return fallback;
    }
    return error.message || fallback;
}

/**
 * Verifica que un producto pertenezca a la tienda del usuario.
 * Protege contra IDOR (Insecure Direct Object Reference).
 * @param {number} productId - ID del producto
 * @param {number} tiendaId - ID de la tienda del usuario (de la sesión)
 * @returns {Promise<object|null>} El producto si pertenece a la tienda, null si no
 */
async function verifyProductOwnership(productId, tiendaId) {
    const product = await db.getAsync(
        'SELECT id_producto, id_tienda FROM Productos WHERE id_producto = ?',
        [productId]
    );
    if (!product || product.id_tienda !== tiendaId) return null;
    return product;
}

/**
 * Verifica que una tienda pertenezca al usuario actual.
 * @param {number} storeIdFromParam - ID de tienda desde req.params
 * @param {number} storeIdFromSession - ID de tienda desde req.session
 * @returns {boolean} true si coinciden
 */
function verifyStoreOwnership(storeIdFromParam, storeIdFromSession) {
    return parseInt(storeIdFromParam) === parseInt(storeIdFromSession);
}

module.exports = { safeError, verifyProductOwnership, verifyStoreOwnership };
