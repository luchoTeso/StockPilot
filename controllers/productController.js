const Product = require('../models/Product');
const ProductFactory = require('../models/products/ProductFactory');
const { safeError, verifyProductOwnership } = require('../utils/securityUtils');
const ExcelJS = require('exceljs');
const stream = require('stream');

class ProductController {
    static async bulkUpload(req, res) {
        try {
            const tiendaId = req.session.tiendaId;
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No se subió ningún archivo' });
            }

            const workbook = new ExcelJS.Workbook();
            const originalName = req.file.originalname.toLowerCase();
            
            if (originalName.endsWith('.csv')) {
                const bufferStream = new stream.PassThrough();
                bufferStream.end(req.file.buffer);
                await workbook.csv.read(bufferStream);
            } else if (originalName.endsWith('.xlsx')) {
                await workbook.xlsx.load(req.file.buffer);
            } else {
                return res.status(400).json({ success: false, error: 'Formato no soportado. Usa .csv o .xlsx' });
            }

            const worksheet = workbook.worksheets[0];
            if (!worksheet) return res.status(400).json({ success: false, error: 'El archivo está vacío' });

            let headerRow = null;
            let colIndexes = {};
            
            worksheet.eachRow((row, rowNumber) => {
                if (!headerRow && row.hasValues) {
                    headerRow = row;
                    row.eachCell((cell, colNumber) => {
                        const val = cell.value ? cell.value.toString().trim().toLowerCase() : '';
                        if (val.includes('codigo') || val.includes('código') || val === 'sku') colIndexes.codigo = colNumber;
                        if (val.includes('nombre') || val.includes('descripcion') || val.includes('descripción')) colIndexes.nombre = colNumber;
                        if (val.includes('precio') || val === 'pvp') colIndexes.precio = colNumber;
                        if (val.includes('costo') || val === 'valor unitario') colIndexes.costo_compra = colNumber;
                        if (val.includes('cantidad') || val === 'stock') colIndexes.cantidad = colNumber;
                        if (val.includes('categoria') || val.includes('categoría')) colIndexes.categoria = colNumber;
                    });
                }
            });

            if (!colIndexes.codigo || !colIndexes.nombre) {
                return res.status(400).json({ success: false, error: 'El archivo debe contener columnas para "Código" y "Nombre"' });
            }

            let successCount = 0;
            let warnings = [];
            const promises = [];

            worksheet.eachRow((row, rowNumber) => {
                if (row === headerRow) return;

                const codigo = row.getCell(colIndexes.codigo)?.value?.toString().trim();
                const nombre = row.getCell(colIndexes.nombre)?.value?.toString().trim();
                const precio = parseFloat(row.getCell(colIndexes.precio)?.value) || 0;
                const costo_compra = parseFloat(row.getCell(colIndexes.costo_compra)?.value) || 0;
                const cantidad = parseInt(row.getCell(colIndexes.cantidad)?.value) || 0;
                const categoria = row.getCell(colIndexes.categoria)?.value?.toString().trim() || 'General';

                if (!codigo || !nombre) {
                    warnings.push(`Fila ${rowNumber}: Ignorada. Falta Código o Nombre.`);
                    return;
                }

                if (precio < 0 || costo_compra < 0 || cantidad < 0) {
                     warnings.push(`Fila ${rowNumber}: Ignorada. Valores numéricos negativos.`);
                     return;
                }

                try {
                    const productInstance = ProductFactory.create({
                        codigo,
                        nombre_producto: nombre,
                        precio,
                        costo_compra,
                        cantidad,
                        categoria,
                        tipo_producto: 'General',
                        id_tienda: tiendaId
                    });

                    const validation = productInstance.validate();
                    if (!validation.valid) {
                        warnings.push(`Fila ${rowNumber}: ${validation.error}`);
                        return;
                    }

                    promises.push(Product.create(productInstance.toDBRecord()).then(() => {
                        successCount++;
                    }).catch(err => {
                        warnings.push(`Fila ${rowNumber}: Error al guardar (${err.message})`);
                    }));
                } catch (err) {
                    warnings.push(`Fila ${rowNumber}: Error (${err.message})`);
                }
            });

            await Promise.allSettled(promises);

            res.json({
                success: true,
                message: 'Carga masiva completada',
                processed: successCount,
                warnings: warnings
            });

        } catch (error) {
            console.error('Error en carga masiva:', error);
            res.status(500).json({ success: false, error: safeError(error, 'Error interno procesando el archivo') });
        }
    }

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