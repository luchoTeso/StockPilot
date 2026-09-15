// routes/productRoutes.js
const express = require('express');
const multer = require('multer');
const ProductController = require('../controllers/productController');
const { requireLogin } = require('../middleware/auth');
const { sanitizeBody, validateProduct } = require('../middleware/validation');
const router = express.Router();

// Configurar multer para guardar el archivo en memoria (Buffer) y con límite de 5MB
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'text/csv', 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo se aceptan .csv y .xlsx'), false);
        }
    }
});

const { fileTypeFromBuffer } = require('file-type');

// Middleware para validar Magic Numbers (primeros bytes reales del archivo)
const validateFileType = async (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: 'Debe subir un archivo Excel o CSV válido.' });
    
    // Si es un CSV, file-type a menudo no lo detecta porque CSV es texto plano.
    // Solo validaremos magic numbers estrictos para archivos binarios (Excel).
    if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || req.file.mimetype === 'application/vnd.ms-excel') {
        const type = await fileTypeFromBuffer(req.file.buffer);
        // xlsx suele detectarse como zip, xls como cfb. Pero fileType detecta xlsx como 'zip' u 'office' internamente.
        // Mientras no sea un ejecutable o formato peligroso, está bien, pero idealmente comprobamos que la extensión detectada sea zip/cfb/xlsx
        if (!type || (type.ext !== 'zip' && type.ext !== 'cfb' && type.ext !== 'xlsx')) {
            return res.status(400).json({ error: 'El archivo Excel parece estar corrompido o es un archivo malicioso disfrazado.' });
        }
    }
    
    next();
};

router.get('/api/productos', requireLogin, ProductController.getProducts);
router.get('/api/productos/:id', requireLogin, ProductController.getProduct);
router.get('/api/productos/barcode/:code', requireLogin, ProductController.getByBarcode);
router.put('/api/productos/:id/link-barcode', requireLogin, sanitizeBody, ProductController.linkBarcode);
router.post('/api/productos/bulk', requireLogin, upload.single('file'), validateFileType, ProductController.bulkUpload);
router.post('/api/productos/admin', requireLogin, sanitizeBody, validateProduct, ProductController.createProduct);
router.put('/api/productos/:id', requireLogin, sanitizeBody, validateProduct, ProductController.updateProduct);
router.put('/api/productos/agregar/:id', requireLogin, sanitizeBody, ProductController.addStock);
router.put('/api/productos/inhabilitar/:id', requireLogin, ProductController.toggleProductStatus);
router.put('/api/productos/habilitar/:id', requireLogin, ProductController.toggleProductStatus);
router.delete('/api/productos/:id', requireLogin, ProductController.deleteProduct);

module.exports = router;