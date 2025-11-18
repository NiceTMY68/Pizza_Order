const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const menuRoutes = require('./menuRoutes');
const tableRoutes = require('./tableRoutes');
const orderRoutes = require('./orderRoutes');
const kitchenRoutes = require('./kitchenRoutes');
const paymentRoutes = require('./paymentRoutes');

router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);
router.use('/tables', tableRoutes);
router.use('/orders', orderRoutes);
router.use('/kitchen', kitchenRoutes);
router.use('/payment', paymentRoutes);

router.get('/', (req, res) => {
  res.json({ 
    message: 'Pizza Order API - Supervisor Endpoints',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      menu: '/api/menu',
      tables: '/api/tables',
      orders: '/api/orders',
      kitchen: '/api/kitchen',
      payment: '/api/payment'
    }
  });
});

module.exports = router;
