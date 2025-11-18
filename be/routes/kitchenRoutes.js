const express = require('express');
const router = express.Router();
const {
  sendToKitchen,
  getKitchenStatus,
  getPendingItems
} = require('../controllers/kitchenController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/orders/:id/send-to-kitchen', sendToKitchen);
router.get('/orders/:id/kitchen-status', getKitchenStatus);
router.get('/pending', getPendingItems);

module.exports = router;
