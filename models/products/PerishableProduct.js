const ProductBase = require('./ProductBase');

/**
 * Representa un producto perecedero (con fecha de vencimiento).
 */
class PerishableProduct extends ProductBase {
    /** @override */
    getDefaults() {
        return {
            ...super.getDefaults(),
            stock_minimo: 10,       // Mayor stock mínimo por riesgo de pérdida
            stock_seguridad: 5,    // Margen de seguridad mayor
            lead_time: 2,          // Reposición más rápida
            frecuencia_compra_dias: 3
        };
    }

    /** @override */
    validate() {
        const baseValidation = super.validate();
        if (!baseValidation.valid) return baseValidation;

        if (!this.data.fecha_vencimiento) {
            return { valid: false, error: 'Los productos perecederos requieren una fecha de vencimiento.' };
        }

        const fechaVencimiento = new Date(this.data.fecha_vencimiento);
        if (fechaVencimiento <= new Date()) {
            return { valid: false, error: 'La fecha de vencimiento debe ser futura.' };
        }

        return { valid: true };
    }
}

module.exports = PerishableProduct;
