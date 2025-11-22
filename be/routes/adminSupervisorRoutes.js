const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/adminAuth');
const {
  getAllSupervisors,
  getSupervisorById,
  createSupervisor,
  updateSupervisor,
  deleteSupervisor
} = require('../controllers/adminSupervisorController');

// All routes require admin authentication
router.use(authenticate);

router.get('/', getAllSupervisors);
router.get('/:id', getSupervisorById);
router.post('/', createSupervisor);
router.put('/:id', updateSupervisor);
router.delete('/:id', deleteSupervisor);

module.exports = router;

