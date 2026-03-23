const express = require('express');
const StoreController = require('../controllers/storeController');
const { requireLogin } = require('../middleware/auth');
const router = express.Router();

router.get('/api/tienda', requireLogin, StoreController.getStoreInfo);
router.put('/api/tienda/update/:id', requireLogin, StoreController.updateStore);
router.put('/api/tienda/estado/:id', requireLogin, StoreController.toggleStoreStatus);

module.exports = router;