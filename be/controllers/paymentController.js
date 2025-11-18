const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Table = require('../models/Table');

const populateOrder = (order) => {
  return Order.findById(order._id)
    .populate('tableId', 'tableNumber floor type')
    .populate('supervisorId', 'name username')
    .populate('items.menuItemId', 'name category price');
};

const processPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.supervisorId.toString() !== req.supervisor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    if (order.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order already paid'
      });
    }

    if (!order.items || order.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order has no items'
      });
    }

    order.calculateTotal();
    const invoiceNumber = await Payment.generateInvoiceNumber();

    const payment = await Payment.create({
      orderId: order._id,
      invoiceNumber,
      supervisorId: req.supervisor._id,
      paymentMethod,
      amount: order.total
    });

    order.status = 'paid';
    order.paymentMethod = paymentMethod;
    order.paidAt = new Date();
    await order.save();

    const table = await Table.findById(order.tableId);
    if (table && table.currentOrderId && table.currentOrderId.toString() === order._id.toString()) {
      await Table.findByIdAndUpdate(order.tableId, {
        currentOrderId: null
      });
    }

    const updatedOrder = await populateOrder(order);

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        order: updatedOrder,
        payment: {
          invoiceNumber: payment.invoiceNumber,
          paymentMethod: payment.paymentMethod,
          amount: payment.amount,
          paidAt: payment.paidAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message
    });
  }
};

const getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('tableId', 'tableNumber floor type')
      .populate('supervisorId', 'name username')
      .populate('items.menuItemId', 'name category price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const payment = await Payment.findOne({ orderId: order._id });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Order not paid'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        invoice: {
          invoiceNumber: payment.invoiceNumber,
          orderNumber: order.orderNumber,
          table: order.tableId,
          supervisor: order.supervisorId,
          items: order.items,
          subtotal: order.subtotal,
          total: order.total,
          paymentMethod: payment.paymentMethod,
          paidAt: payment.paidAt,
          createdAt: order.createdAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message
    });
  }
};

module.exports = {
  processPayment,
  getInvoice
};
