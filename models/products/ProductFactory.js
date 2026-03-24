const PerishableProduct = require('./PerishableProduct');
const NonPerishableProduct = require('./NonPerishableProduct');
const DigitalProduct = require('./DigitalProduct');

/**
 * Fábrica central para la creación de objetos de producto.
 * Implementa el patrón Factory Method para gestionar la extensibilidad.
 */
class ProductFactory {
    /**
     * Crea una instancia de producto basada en el tipo proporcionado.
     * @param {Object} productData - Datos del producto incluyendo 'tipo_producto'
     * @returns {ProductBase} Instancia de la subclase correspondiente
     */
    static create(productData) {
        const type = productData.tipo_producto || 'No Perecedero';

        switch (type) {
            case 'Perecedero':
                return new PerishableProduct(productData);
            case 'No Perecedero':
                return new NonPerishableProduct(productData);
            case 'Digital':
                return new DigitalProduct(productData);
            default:
                console.warn(`Tipo de producto desconocido: ${type}. Usando NonPerishableProduct.`);
                return new NonPerishableProduct(productData);
        }
    }
}

module.exports = ProductFactory;
