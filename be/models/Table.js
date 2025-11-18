const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: [true, 'Table number is required'],
    unique: true,
    trim: true
  },
  floor: {
    type: Number,
    enum: [1, 2, null],
    default: null
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['table', 'takeaway', 'pizza_bar'],
    default: 'table'
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved'],
    default: 'available'
  },
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  }
}, {
  timestamps: true
});

tableSchema.index({ floor: 1, type: 1 });
tableSchema.index({ status: 1 });

module.exports = mongoose.model('Table', tableSchema);
