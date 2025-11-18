const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['drink', 'pizza', 'pasta'],
    lowercase: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be greater than or equal to 0']
  },
  supportsHalfHalf: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: null,
    trim: true
  }
}, {
  timestamps: true
});

menuItemSchema.index({ category: 1, isAvailable: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
