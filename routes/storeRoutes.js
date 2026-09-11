const express = require('express');
const StoreController = require('../controllers/storeController');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/api/tienda', requireLogin, StoreController.getStoreInfo);
router.put('/api/tienda/update/:id', requireLogin, StoreController.updateStore);
router.put('/api/tienda/estado/:id', requireLogin, StoreController.toggleStoreStatus);

// Multi-tienda
router.get('/api/tiendas', requireLogin, requireAdmin, StoreController.getAllStores);
router.post('/api/tiendas', requireLogin, requireAdmin, StoreController.createStore);
router.post('/api/tiendas/switch/:id', requireLogin, requireAdmin, StoreController.switchStore);

module.exports = router;