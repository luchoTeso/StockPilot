/**
 * Clase base abstracta para todos los productos del sistema.
 * Define la interfaz y comportamiento común que las subclases deben implementar.
 */
class ProductBase {
    /**
     * @param {Object} data - Los datos iniciales del producto
     */
    constructor(data) {
        this.data = {
            ...this.getDefaults(),
            ...data
        };
    }

    /**
     * Valores predeterminados que pueden ser sobrescritos por subclases.
     * @returns {Object}
     */
    getDefaults() {
        return {
            stock_minimo: 5,
            stock_seguridad: 0,
            lead_time: 3,
            frecuencia_compra_dias: 7,
            precio: 0,
            cantidad: 0
        };
    }

    /**
     * Valida el producto antes de ser guardado.
     * @returns {{valid: boolean, error: string}}
     */
    validate() {
        if (!this.data.nombre_producto || this.data.nombre_producto.trim() === '') {
            return { valid: false, error: 'El nombre del producto es obligatorio.' };
        }
        if (this.data.precio < 0) {
            return { valid: false, error: 'El precio no puede ser negativo.' };
        }
        return { valid: true };
    }

    /**
     * Retorna los datos limpios para inserción en la base de datos SQL.
     * @returns {Object}
     */
    toDBRecord() {
        return {
            ...this.data,
            precio: parseFloat(this.data.precio) || 0,
            cantidad: parseInt(this.data.cantidad) || 0,
            id_proveedor: this.data.id_proveedor ? parseInt(this.data.id_proveedor) : null,
            stock_minimo: parseInt(this.data.stock_minimo) || 5,
            stock_seguridad: parseInt(this.data.stock_seguridad) || 0,
            lead_time: parseInt(this.data.lead_time) || 3
        };
    }
}

module.exports = ProductBase;
