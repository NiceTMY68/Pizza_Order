const mongoose = require('mongoose');

/**
 * Schema cho một item trong order
 * Mỗi order có thể có nhiều items (món ăn)
 */
const orderItemSchema = new mongoose.Schema({
  // ID của menu item (reference đến MenuItem collection)
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  // Tên món (lưu lại để tránh phải populate khi hiển thị)
  name: {
    type: String,
    required: true
  },
  // Số lượng (cho phép 0.5 cho pizza nửa)
  quantity: {
    type: Number,
    required: true,
    min: [0.5, 'Quantity must be greater than 0']
  },
  // Giá đơn vị tại thời điểm order (giá có thể thay đổi)
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price must be greater than or equal to 0']
  },
  // Tổng giá = unitPrice * quantity
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price must be greater than or equal to 0']
  },
  // Ghi chú đặc biệt cho món (ví dụ: không cay, thêm phô mai)
  note: {
    type: String,
    default: ''
  },
  // Trạng thái trong bếp: pending (chưa gửi), sent (đã gửi), cooking (đang nấu), ready (xong), declined (từ chối)
  kitchenStatus: {
    type: String,
    enum: ['pending', 'sent', 'cooking', 'ready', 'declined'],
    default: 'pending'
  },
  // Thời gian gửi đến bếp
  sentToKitchenAt: {
    type: Date,
    default: null
  },
  // Thời gian bếp hoàn thành
  readyAt: {
    type: Date,
    default: null
  },
  // Thời gian bếp từ chối
  declinedAt: {
    type: Date,
    default: null
  }
}, { _id: true });

/**
 * Schema cho Order (đơn hàng)
 * Mỗi order thuộc về một table và được tạo bởi một supervisor
 */
const orderSchema = new mongoose.Schema({
  // Số đơn hàng duy nhất (format: ORD-YYYYMMDD-0001)
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  // ID của bàn (reference đến Table collection)
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  // ID của supervisor tạo order (reference đến Supervisor collection)
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supervisor',
    required: true
  },
  // Trạng thái order: draft (nháp), sent_to_kitchen (đã gửi bếp), cooking (đang nấu), completed (hoàn thành), paid (đã thanh toán), cancelled (hủy)
  status: {
    type: String,
    enum: ['draft', 'sent_to_kitchen', 'cooking', 'completed', 'paid', 'cancelled'],
    default: 'draft'
  },
  // Danh sách các món trong order
  items: [orderItemSchema],
  // Tổng tiền trước thuế (hiện tại = total vì chưa có thuế)
  subtotal: {
    type: Number,
    default: 0,
    min: [0, 'Subtotal must be greater than or equal to 0']
  },
  // Tổng tiền cuối cùng
  total: {
    type: Number,
    default: 0,
    min: [0, 'Total must be greater than or equal to 0']
  },
  // Phương thức thanh toán: cash (tiền mặt), card (thẻ), bank (chuyển khoản), null (chưa thanh toán)
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank', null],
    default: null
  },
  // Thời gian thanh toán
  paidAt: {
    type: Date,
    default: null
  },
  // Ghi chú cho toàn bộ order
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

// Tạo index để tối ưu query
orderSchema.index({ tableId: 1, status: 1 }); // Tìm order theo table và status
orderSchema.index({ supervisorId: 1 }); // Tìm order theo supervisor
orderSchema.index({ orderNumber: 1 }); // Tìm order theo số đơn hàng
orderSchema.index({ createdAt: -1 }); // Sắp xếp theo thời gian tạo

/**
 * Method tính lại tổng tiền của order
 * Tính từ tổng totalPrice của tất cả items
 * @returns {Number} Tổng tiền
 */
orderSchema.methods.calculateTotal = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.total = this.subtotal;
  return this.total;
};

/**
 * Static method tạo số đơn hàng tự động
 * Format: ORD-YYYYMMDD-0001, ORD-YYYYMMDD-0002, ...
 * Tự động tăng sequence mỗi ngày
 * @returns {Promise<String>} Số đơn hàng
 */
orderSchema.statics.generateOrderNumber = async function() {
  const date = new Date();
  // Lấy ngày hiện tại dạng YYYYMMDD
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ORD-${dateStr}-`;
  
  // Tìm order cuối cùng trong ngày
  const lastOrder = await this.findOne({
    orderNumber: { $regex: `^${prefix}` }
  }).sort({ orderNumber: -1 }).select('orderNumber');
  
  // Tăng sequence từ order cuối cùng
  let sequence = 1;
  if (lastOrder && lastOrder.orderNumber) {
    const lastSequence = parseInt(lastOrder.orderNumber.replace(prefix, ''));
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Trả về số đơn hàng với sequence được pad 4 số (0001, 0002, ...)
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

module.exports = mongoose.model('Order', orderSchema);
