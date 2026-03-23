// controllers/productController.js
const Product = require('../models/Product');

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
            const producto = await Product.findById(productId);
            
            if (!producto) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }
            
            res.json(producto);
        } catch (error) {
            console.error('Error obteniendo producto:', error);
            res.status(500).json({ success: false, error: 'Error al obtener producto' });
        }
    }

    static async createProduct(req, res) {
        try {
            const {
                codigo,
                nombre_producto,
                categoria,
                subcategoria,
                tipo_producto,
                precio,
                cantidad,
                stock_minimo,
                stock_seguridad,
                lead_time
            } = req.body;

            const tiendaId = req.session.tiendaId;

            const productData = {
                codigo,
                nombre_producto,
                categoria,
                subcategoria,
                tipo_producto,
                precio: parseFloat(precio),
                cantidad: parseInt(cantidad),
                id_tienda: tiendaId,
                stock_minimo: parseInt(stock_minimo || 5),
                stock_seguridad: parseInt(stock_seguridad || 0),
                lead_time: parseInt(lead_time || 3)
            };

            await Product.create(productData);
            res.json({ success: true, message: "Producto registrado correctamente" });
        } catch (error) {
            console.error('Error creando producto:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async updateProduct(req, res) {
        try {
            const productId = req.params.id;
            const productData = req.body;

            const success = await Product.update(productId, productData);
            
            if (!success) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }

            res.json({ success: true, message: "Producto actualizado correctamente" });
        } catch (error) {
            console.error('Error actualizando producto:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async addStock(req, res) {
        try {
            const productId = req.params.id;
            const { cantidad } = req.body;

            const success = await Product.addStock(productId, parseInt(cantidad));
            
            if (!success) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }

            res.json({ success: true, message: "Stock agregado correctamente" });
        } catch (error) {
            console.error('Error agregando stock:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async toggleProductStatus(req, res) {
        try {
            const productId = req.params.id;
            const estado = req.originalUrl.includes('inhabilitar') ? 'Inactivo' : 'Disponible';

            const success = await Product.toggleStatus(productId, estado);
            
            if (!success) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }

            const action = estado === 'Disponible' ? 'habilitado' : 'inhabilitado';
            res.json({ success: true, message: `Producto ${action} correctamente` });
        } catch (error) {
            console.error('Error cambiando estado de producto:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async deleteProduct(req, res) {
        try {
            const productId = req.params.id;
            const success = await Product.delete(productId);
            
            if (!success) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }

            res.json({ success: true, message: "Producto eliminado" });
        } catch (error) {
            console.error('Error eliminando producto:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = ProductController;