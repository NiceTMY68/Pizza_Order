const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/adminAuth');
const {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/adminMenuController');

// All routes require admin authentication
router.use(authenticate);

router.get('/', getAllMenuItems);
router.get('/:id', getMenuItemById);
router.post('/', createMenuItem);
router.put('/:id', updateMenuItem);
router.delete('/:id', deleteMenuItem);

module.exports = router;

