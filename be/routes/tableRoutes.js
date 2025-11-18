const express = require('express');
const router = express.Router();
const {
  getAllTables,
  getTablesByFloor,
  getTakeAwaySlots,
  getTableById,
  getTableStatus,
  updateTableStatus
} = require('../controllers/tableController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAllTables);
router.get('/floor/:floor', getTablesByFloor);
router.get('/takeaway', getTakeAwaySlots);
router.get('/:id', getTableById);
router.get('/:id/status', getTableStatus);
router.put('/:id/status', updateTableStatus);

module.exports = router;
