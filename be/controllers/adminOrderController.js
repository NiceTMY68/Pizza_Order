const Order = require('../models/Order');
const Table = require('../models/Table');
const Supervisor = require('../models/Supervisor');

/**
 * Lấy danh sách tất cả orders với filter
 */
const getAllOrders = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      supervisorId, 
      tableId,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Supervisor filter
    if (supervisorId) {
      query.supervisorId = supervisorId;
    }

    // Table filter
    if (tableId) {
      query.tableId = tableId;
    }

    // Search by order number
    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('tableId', 'tableNumber floor type')
      .populate('supervisorId', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin một order
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('tableId')
      .populate('supervisorId', 'name username')
      .populate('items.menuItemId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

/**
 * Hủy order (admin có quyền hủy bất kỳ order nào)
 */
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel paid order'
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    order.status = 'cancelled';
    await order.save();

    // Update table status if needed
    if (order.tableId) {
      const table = await Table.findById(order.tableId);
      if (table && table.currentOrderId?.toString() === order._id.toString()) {
        table.currentOrderId = null;
        table.status = 'available';
        await table.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

/**
 * Admin cập nhật discount cho order
 */
const setOrderDiscount = async (req, res) => {
  try {
    const { discountType, discountValue, discountReason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'paid' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update discount for paid or cancelled order'
      });
    }

    if (discountType === null || discountType === '') {
      order.discountType = null;
      order.discountValue = 0;
      order.discountReason = '';
    } else {
      if (!['percent', 'amount'].includes(discountType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid discount type'
        });
      }
      const valueNum = Number(discountValue);
      if (isNaN(valueNum) || valueNum < 0) {
        return res.status(400).json({
          success: false,
          message: 'Discount value must be a non-negative number'
        });
      }
      order.subtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
      if (discountType === 'percent' && valueNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Percent discount cannot exceed 100'
        });
      }
      if (discountType === 'amount' && valueNum > order.subtotal) {
        return res.status(400).json({
          success: false,
          message: 'Amount discount cannot exceed subtotal'
        });
      }
      order.discountType = discountType;
      order.discountValue = valueNum;
      if (discountReason !== undefined) {
        order.discountReason = discountReason;
      }
    }

    order.calculateTotal();
    await order.save();

    const populated = await Order.findById(order._id)
      .populate('tableId', 'tableNumber floor type')
      .populate('supervisorId', 'name username');

    res.status(200).json({
      success: true,
      message: 'Discount updated successfully',
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update discount',
      error: error.message
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  cancelOrder,
  setOrderDiscount
};

