const express = require('express');
const router = express.Router();
const {
  processPayment,
  getInvoice
} = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { validatePayment } = require('../middleware/validation');

router.use(authenticate);

router.post('/orders/:id/pay', validatePayment, processPayment);
router.get('/orders/:id/invoice', getInvoice);

module.exports = router;
