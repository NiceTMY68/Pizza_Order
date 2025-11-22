const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/adminAuth');
const { getDashboard } = require('../controllers/adminController');
const { testPayments } = require('../controllers/adminTestController');

// All admin routes require authentication
router.use(authenticate);

// Dashboard
router.get('/dashboard', getDashboard);

// Test endpoint (remove in production)
router.get('/test/payments', testPayments);

module.exports = router;

