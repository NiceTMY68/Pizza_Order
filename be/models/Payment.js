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
    enum: ['cash', 'card', 'bank']
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be greater than or equal to 0']
  },
  paidAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ invoiceNumber: 1 });
paymentSchema.index({ supervisorId: 1 });
paymentSchema.index({ paidAt: -1 });

paymentSchema.statics.generateInvoiceNumber = async function() {
  const count = await this.countDocuments();
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

module.exports = mongoose.model('Payment', paymentSchema);
