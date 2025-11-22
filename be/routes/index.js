const express = require('express');
const router = express.Router();

// Supervisor routes
const authRoutes = require('./authRoutes');
const menuRoutes = require('./menuRoutes');
const tableRoutes = require('./tableRoutes');
const orderRoutes = require('./orderRoutes');
const kitchenRoutes = require('./kitchenRoutes');
const paymentRoutes = require('./paymentRoutes');

// Admin routes
const adminAuthRoutes = require('./adminAuthRoutes');
const adminRoutes = require('./adminRoutes');
const adminSupervisorRoutes = require('./adminSupervisorRoutes');
const adminMenuRoutes = require('./adminMenuRoutes');
const adminTableRoutes = require('./adminTableRoutes');
const adminOrderRoutes = require('./adminOrderRoutes');
const adminReportRoutes = require('./adminReportRoutes');

// Supervisor routes
router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);
router.use('/tables', tableRoutes);
router.use('/orders', orderRoutes);
router.use('/kitchen', kitchenRoutes);
router.use('/payment', paymentRoutes);

// Admin routes
router.use('/admin/auth', adminAuthRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/supervisors', adminSupervisorRoutes);
router.use('/admin/menu', adminMenuRoutes);
router.use('/admin/tables', adminTableRoutes);
router.use('/admin/orders', adminOrderRoutes);
router.use('/admin/reports', adminReportRoutes);

router.get('/', (req, res) => {
  res.json({ 
    message: 'Pizza Order API',
    version: '1.0.0',
    endpoints: {
      supervisor: {
        auth: '/api/auth',
        menu: '/api/menu',
        tables: '/api/tables',
        orders: '/api/orders',
        kitchen: '/api/kitchen',
        payment: '/api/payment'
      },
      admin: {
        auth: '/api/admin/auth',
        dashboard: '/api/admin/dashboard',
        supervisors: '/api/admin/supervisors',
        menu: '/api/admin/menu',
        tables: '/api/admin/tables',
        orders: '/api/admin/orders',
        reports: '/api/admin/reports'
      }
    }
  });
});

module.exports = router;
