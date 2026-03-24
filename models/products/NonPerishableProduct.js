const ProductBase = require('./ProductBase');

/**
 * Representa un producto no perecedero (estándar).
 */
class NonPerishableProduct extends ProductBase {
    /** @override */
    getDefaults() {
        return {
            ...super.getDefaults(),
            stock_minimo: 5,
            stock_seguridad: 2,
            lead_time: 7,
            frecuencia_compra_dias: 15
        };
    }

    /** @override */
    validate() {
        return super.validate();
    }
}

module.exports = NonPerishableProduct;
