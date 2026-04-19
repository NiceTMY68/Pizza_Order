const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supervisor',
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'bank', 'momo']
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled'],
    default: 'paid'
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be greater than or equal to 0']
  },
  providerAmount: {
    type: Number,
    default: null,
    min: [0, 'Provider amount must be greater than or equal to 0']
  },
  discountType: {
    type: String,
    enum: ['percent', 'amount', null],
    default: null
  },
  discountValue: {
    type: Number,
    default: 0,
    min: [0, 'Discount value must be greater than or equal to 0']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount must be greater than or equal to 0']
  },
  momo: {
    partnerCode: { type: String, default: null },
    orderId: { type: String, default: null },
    requestId: { type: String, default: null },
    transId: { type: String, default: null },
    resultCode: { type: Number, default: null },
    message: { type: String, default: null },
    payUrl: { type: String, default: null },
    deeplink: { type: String, default: null },
    qrCodeUrl: { type: String, default: null },
    responseTime: { type: String, default: null },
    extraData: { type: String, default: null },
    signature: { type: String, default: null }
  },
  paidAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ invoiceNumber: 1 });
paymentSchema.index({ supervisorId: 1 });
paymentSchema.index({ paidAt: -1 });
paymentSchema.index({ paymentMethod: 1, status: 1 });
paymentSchema.index({ 'momo.orderId': 1 });

paymentSchema.statics.generateInvoiceNumber = async function() {
  const count = await this.countDocuments();
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

module.exports = mongoose.model('Payment', paymentSchema);
