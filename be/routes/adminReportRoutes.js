const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/adminAuth');
const {
  getRevenueReport,
  getMenuItemReport,
  getSupervisorReport,
  getOperationalMetrics,
  getFinancialHealth
} = require('../controllers/adminReportController');

// All routes require admin authentication
router.use(authenticate);

router.get('/revenue', getRevenueReport);
router.get('/menu-items', getMenuItemReport);
router.get('/supervisors', getSupervisorReport);
router.get('/operational', getOperationalMetrics);
router.get('/financial', getFinancialHealth);

module.exports = router;

