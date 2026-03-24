const ProductBase = require('./ProductBase');

/**
 * Representa un producto digital (intangible).
 */
class DigitalProduct extends ProductBase {
    /** @override */
    getDefaults() {
        return {
            ...super.getDefaults(),
            stock_minimo: 0,       // No requiere stock físico
            stock_seguridad: 0,
            lead_time: 0,          // Entrega inmediata
            cantidad: 999999       // Stock virtualmente infinito
        };
    }

    /** @override */
    validate() {
        const baseValidation = super.validate();
        if (!baseValidation.valid) return baseValidation;

        // Validaciones específicas para digitales (ej: link de descarga, licencia, etc.)
        return { valid: true };
    }
}

module.exports = DigitalProduct;
