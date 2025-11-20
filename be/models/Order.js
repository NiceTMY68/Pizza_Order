const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.5, 'Quantity must be greater than 0']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price must be greater than or equal to 0']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price must be greater than or equal to 0']
  },
  note: {
    type: String,
    default: ''
  },
  kitchenStatus: {
    type: String,
    enum: ['pending', 'sent', 'cooking', 'ready', 'declined'],
    default: 'pending'
  },
  sentToKitchenAt: {
    type: Date,
    default: null
  },
  readyAt: {
    type: Date,
    default: null
  },
  declinedAt: {
    type: Date,
    default: null
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supervisor',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent_to_kitchen', 'cooking', 'completed', 'paid', 'cancelled'],
    default: 'draft'
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    default: 0,
    min: [0, 'Subtotal must be greater than or equal to 0']
  },
  total: {
    type: Number,
    default: 0,
    min: [0, 'Total must be greater than or equal to 0']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank', null],
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

orderSchema.index({ tableId: 1, status: 1 });
orderSchema.index({ supervisorId: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.methods.calculateTotal = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.total = this.subtotal;
  return this.total;
};

orderSchema.statics.generateOrderNumber = async function() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ORD-${dateStr}-`;
  
  const lastOrder = await this.findOne({
    orderNumber: { $regex: `^${prefix}` }
  }).sort({ orderNumber: -1 }).select('orderNumber');
  
  let sequence = 1;
  if (lastOrder && lastOrder.orderNumber) {
    const lastSequence = parseInt(lastOrder.orderNumber.replace(prefix, ''));
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

module.exports = mongoose.model('Order', orderSchema);
