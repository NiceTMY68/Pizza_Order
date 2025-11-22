const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/adminAuth');
const {
  getAllOrders,
  getOrderById,
  cancelOrder
} = require('../controllers/adminOrderController');

// All routes require admin authentication
router.use(authenticate);

router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

module.exports = router;

