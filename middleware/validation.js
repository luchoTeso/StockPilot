// middleware/validation.js

/**
 * Sanitiza un string: trim y escape de caracteres HTML básicos
 */
function sanitize(str) {
    if (typeof str !== 'string') return str;
    return str.trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Sanitiza todos los campos string del body
 */
/* v8 ignore start */
function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        for (const key of Object.keys(req.body)) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitize(req.body[key]);
            }
        }
    }
    next();
}

/**
 * Valida campos de login
 */
function validateLogin(req, res, next) {
    const { login, password, rol } = req.body;

    if (!login || !password || !rol) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }

    const rolesValidos = ['Administrador', 'Tendero'];
    if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ success: false, error: 'Rol no válido' });
    }

    next();
}

/**
 * Valida campos de registro
 */
function validateRegister(req, res, next) {
    const { name, email, username, password, store_name } = req.body;

    if (!name || !email || !username || !password || !store_name) {
        return res.status(400).json({ success: false, error: 'Todos los campos son obligatorios' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: 'Formato de correo electrónico inválido' });
    }

    // Validar longitud de contraseña (OWASP A04: mínimo 8 caracteres)
    if (password.length < 8) {
        return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    next();
}

/**
 * Valida campos de producto
 */
function validateProduct(req, res, next) {
    const { codigo, nombre_producto, precio, cantidad } = req.body;

    if (!codigo || !nombre_producto) {
        return res.status(400).json({ success: false, error: 'Código y nombre del producto son obligatorios' });
    }

    if (precio !== undefined && (isNaN(parseFloat(precio)) || parseFloat(precio) < 0)) {
        return res.status(400).json({ success: false, error: 'El precio debe ser un número positivo' });
    }

    if (cantidad !== undefined && (isNaN(parseInt(cantidad)) || parseInt(cantidad) < 0)) {
        return res.status(400).json({ success: false, error: 'La cantidad debe ser un número entero positivo' });
    }

    next();
}

/**
 * Valida campos de venta
 */
function validateSale(req, res, next) {
    const { id_producto, cantidad } = req.body;

    if (!id_producto || !cantidad) {
        return res.status(400).json({ success: false, error: 'Producto y cantidad son obligatorios' });
    }

    if (isNaN(parseInt(cantidad)) || parseInt(cantidad) <= 0) {
        return res.status(400).json({ success: false, error: 'La cantidad debe ser un número entero mayor a 0' });
    }

    next();
}

/**
 * Valida campos de reporte
 */
function validateReport(req, res, next) {
    const { titulo, descripcion, fecha_reporte, creador, tipo } = req.body;

    if (!titulo || !descripcion || !fecha_reporte || !creador || !tipo) {
        return res.status(400).json({ success: false, error: 'Todos los campos son obligatorios' });
    }

    next();
}
/* v8 ignore stop */

module.exports = {
    sanitize,
    sanitizeBody,
    validateLogin,
    validateRegister,
    validateProduct,
    validateSale,
    validateReport
};
