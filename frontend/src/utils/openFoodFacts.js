import axios from 'axios';

/**
 * Consulta la API pública de Open Food Facts para obtener detalles de un producto mediante su código de barras.
 * Implementa un timeout para evitar ralentizar la experiencia del usuario.
 * 
 * @param {string} barcode Código de barras del producto
 * @returns {Promise<Object|null>} Objeto con los datos pre-rellenados o null si falla/no existe.
 */
export const fetchProductFromOpenFoodFacts = async (barcode) => {
  if (!barcode) return null;

  try {
    // Configuramos un timeout muy agresivo (3 segundos) para que la UI no se bloquee.
    const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
      timeout: 3000 
    });

    if (response.data && response.data.status === 1) {
      const product = response.data.product;
      
      // Sanitización y mapeo de datos: intentamos rescatar lo más relevante
      const productName = product.product_name || product.product_name_es || product.product_name_en || '';
      const brand = product.brands ? product.brands.split(',')[0] : '';
      
      // Intentamos obtener una categoría genérica si está disponible
      let category = '';
      if (product.categories_hierarchy && product.categories_hierarchy.length > 0) {
        const rawCategory = product.categories_hierarchy[0].replace('en:', '').replace('es:', '');
        category = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);
      }

      return {
        nombre_producto: brand ? `${brand} ${productName}`.trim() : productName,
        categoria: category,
        foto_url: product.image_front_url || product.image_url || ''
      };
    }
    
    return null; // Producto no encontrado en la base de datos externa
  } catch (error) {
    console.warn("Error o Timeout consultando Open Food Facts:", error.message);
    // Retornamos silenciosamente null para no molestar al usuario con errores de APIs externas
    return null;
  }
};
