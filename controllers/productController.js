const Product = require('../models/Product');
const ProductFactory = require('../models/products/ProductFactory');
const { safeError, verifyProductOwnership } = require('../utils/securityUtils');

class ProductController {
    static async getProducts(req, res) {
        try {
            const tiendaId = req.session.tiendaId;
            const productos = await Product.findByStore(tiendaId);
            res.json(productos);
        } catch (error) {
            console.error('Error obteniendo productos:', error);
            res.status(500).json({ success: false, error: 'Error al obtener productos' });
        }
    }

    static async getProduct(req, res) {
        try {
            const productId = req.params.id;
            const tiendaId = req.session.tiendaId;
            const producto = await Product.findById(productId);
            
            if (!producto || producto.id_tienda !== tiendaId) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }
            
            res.json(producto);
        } catch (error) {
            console.error('Error obteniendo producto:', error);
            res.status(500).json({ success: false, error: safeError(error, 'Error al obtener producto') });
        }
    }

    static async createProduct(req, res) {
        try {
            const tiendaId = req.session.tiendaId;
            
            // Usamos la fábrica para crear la instancia correcta del producto
            // Esto cumple con el patrón Factory Method y permite extensibilidad lógica
            const productInstance = ProductFactory.create({
                ...req.body,
                id_tienda: tiendaId
            });

            // Validación específica según el tipo de producto
            const validation = productInstance.validate();
            if (!validation.valid) {
                return res.status(400).json({ success: false, error: validation.error });
            }

            // Guardamos el registro limpio en la base de datos
            await Product.create(productInstance.toDBRecord());
            
            res.json({ success: true, message: "Producto registrado correctamente" });
        } catch (error) {
            console.error('Error creando producto:', error);
            res.status(500).json({ success: false, error: safeError(error, 'Error al crear producto') });
        }
    }

    static async updateProduct(req, res) {
        try {
            const productId = req.params.id;
            const tiendaId = req.session.tiendaId;

            // 🛡️ IDOR: Verificar que el producto pertenece a la tienda del usuario
            const ownership = await verifyProductOwnership(productId, tiendaId);
            if (!ownership) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }
            
            // Incluso al actualizar, usamos la fábrica para validar las reglas del tipo de producto
            const productInstance = ProductFactory.create(req.body);
            const validation = productInstance.validate();
            
            if (!validation.valid) {
                return res.status(400).json({ success: false, error: validation.error });
            }

            const success = await Product.update(productId, productInstance.toDBRecord());
            
            if (!success) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }

            res.json({ success: true, message: "Producto actualizado correctamente" });
        } catch (error) {
            console.error('Error actualizando producto:', error);
            res.status(500).json({ success: false, error: safeError(error, 'Error al actualizar producto') });
        }
    }

    static async addStock(req, res) {
        try {
            const productId = req.params.id;
            const tiendaId = req.session.tiendaId;
            const { cantidad } = req.body;

            // 🛡️ IDOR: Verificar propiedad
            const ownership = await verifyProductOwnership(productId, tiendaId);
            if (!ownership) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }

            const success = await Product.addStock(productId, parseInt(cantidad));
            
            if (!success) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }

            res.json({ success: true, message: "Stock agregado correctamente" });
        } catch (error) {
            console.error('Error agregando stock:', error);
            res.status(500).json({ success: false, error: safeError(error, 'Error al agregar stock') });
        }
    }

    static async toggleProductStatus(req, res) {
        try {
            const productId = req.params.id;
            const tiendaId = req.session.tiendaId;
            const estado = req.originalUrl.includes('inhabilitar') ? 'Inactivo' : 'Disponible';

            // 🛡️ IDOR: Verificar propiedad
            const ownership = await verifyProductOwnership(productId, tiendaId);
            if (!ownership) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }

            const success = await Product.toggleStatus(productId, estado);
            
            if (!success) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }

            const action = estado === 'Disponible' ? 'habilitado' : 'inhabilitado';
            res.json({ success: true, message: `Producto ${action} correctamente` });
        } catch (error) {
            console.error('Error cambiando estado de producto:', error);
            res.status(500).json({ success: false, error: safeError(error, 'Error al cambiar estado del producto') });
        }
    }

    static async deleteProduct(req, res) {
        try {
            const productId = req.params.id;
            const tiendaId = req.session.tiendaId;

            // 🛡️ IDOR: Verificar propiedad
            const ownership = await verifyProductOwnership(productId, tiendaId);
            if (!ownership) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }

            const success = await Product.delete(productId);
            
            if (!success) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }

            res.json({ success: true, message: "Producto eliminado" });
        } catch (error) {
            console.error('Error eliminando producto:', error);
            res.status(500).json({ success: false, error: safeError(error, 'Error al eliminar producto') });
        }
    }
}

module.exports = ProductController;