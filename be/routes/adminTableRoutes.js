const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/adminAuth');
const {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable
} = require('../controllers/adminTableController');

// All routes require admin authentication
router.use(authenticate);

router.get('/', getAllTables);
router.get('/:id', getTableById);
router.post('/', createTable);
router.put('/:id', updateTable);
router.delete('/:id', deleteTable);

module.exports = router;

