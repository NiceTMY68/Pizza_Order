const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByTable,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem
} = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { validateOrder, validateOrderItem } = require('../middleware/validation');

router.use(authenticate);

router.get('/', getAllOrders);
router.get('/table/:tableId', getOrdersByTable);
router.get('/:id', getOrderById);
router.post('/', validateOrder, createOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);
router.post('/:id/items', validateOrderItem, addOrderItem);
router.put('/:id/items/:itemId', updateOrderItem);
router.delete('/:id/items/:itemId', deleteOrderItem);

module.exports = router;
