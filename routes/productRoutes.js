// routes/productRoutes.js
const express = require('express');
const ProductController = require('../controllers/productController');
const { requireLogin } = require('../middleware/auth');
const { sanitizeBody, validateProduct } = require('../middleware/validation');
const router = express.Router();

router.get('/api/productos', requireLogin, ProductController.getProducts);
router.get('/api/productos/:id', requireLogin, ProductController.getProduct);
router.post('/api/productos/admin', requireLogin, sanitizeBody, validateProduct, ProductController.createProduct);
router.put('/api/productos/:id', requireLogin, sanitizeBody, validateProduct, ProductController.updateProduct);
router.put('/api/productos/agregar/:id', requireLogin, sanitizeBody, ProductController.addStock);
router.put('/api/productos/inhabilitar/:id', requireLogin, ProductController.toggleProductStatus);
router.put('/api/productos/habilitar/:id', requireLogin, ProductController.toggleProductStatus);
router.delete('/api/productos/:id', requireLogin, ProductController.deleteProduct);

module.exports = router;