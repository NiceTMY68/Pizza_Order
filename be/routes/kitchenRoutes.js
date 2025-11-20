const express = require('express');
const router = express.Router();
const {
  sendToKitchen,
  getKitchenStatus,
  getPendingItems,
  updateItemStatus
} = require('../controllers/kitchenController');
const { authenticate } = require('../middleware/auth');

router.post('/orders/:id/send-to-kitchen', authenticate, sendToKitchen);
router.get('/orders/:id/kitchen-status', authenticate, getKitchenStatus);
router.get('/pending', getPendingItems);
router.patch('/orders/:orderId/items/:itemId/status', updateItemStatus);

module.exports = router;
