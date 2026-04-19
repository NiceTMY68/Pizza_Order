const express = require('express');
const router = express.Router();
const {
  processPayment,
  createMomoQrPayment,
  momoIpn,
  getMomoPaymentStatus,
  getInvoice
} = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { validatePayment } = require('../middleware/validation');

router.post('/momo/ipn', momoIpn);

router.use(authenticate);

router.post('/orders/:id/pay', validatePayment, processPayment);
router.post('/orders/:id/momo/create', createMomoQrPayment);
router.get('/orders/:id/momo/status', getMomoPaymentStatus);
router.get('/orders/:id/invoice', getInvoice);

module.exports = router;
