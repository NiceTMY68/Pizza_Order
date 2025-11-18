const Order = require('../models/Order');

const populateOrder = (order) => {
  return Order.findById(order._id)
    .populate('tableId', 'tableNumber floor type')
    .populate('supervisorId', 'name username')
    .populate('items.menuItemId', 'name category price');
};

const sendToKitchen = async (req, res) => {
  try {
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

    if (!order.items || order.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order has no items'
      });
    }

    const pendingItems = order.items.filter(item => item.kitchenStatus === 'pending');

    if (pendingItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All items have been sent to kitchen'
      });
    }

    pendingItems.forEach(item => {
      item.kitchenStatus = 'sent';
      item.sentToKitchenAt = new Date();
    });

    if (order.status === 'draft') {
      order.status = 'sent_to_kitchen';
    }

    await order.save();
    const updatedOrder = await populateOrder(order);

    res.status(200).json({
      success: true,
      message: `${pendingItems.length} item(s) sent to kitchen`,
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send items to kitchen',
      error: error.message
    });
  }
};

const getKitchenStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItemId', 'name category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const itemsByStatus = {
      pending: order.items.filter(item => item.kitchenStatus === 'pending'),
      sent: order.items.filter(item => item.kitchenStatus === 'sent'),
      cooking: order.items.filter(item => item.kitchenStatus === 'cooking'),
      ready: order.items.filter(item => item.kitchenStatus === 'ready')
    };

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        itemsByStatus,
        summary: {
          pending: itemsByStatus.pending.length,
          sent: itemsByStatus.sent.length,
          cooking: itemsByStatus.cooking.length,
          ready: itemsByStatus.ready.length,
          total: order.items.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch kitchen status',
      error: error.message
    });
  }
};

const getPendingItems = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['sent_to_kitchen', 'cooking'] }
    })
      .populate('tableId', 'tableNumber floor type')
      .populate('supervisorId', 'name')
      .populate('items.menuItemId', 'name category');

    const pendingItems = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.kitchenStatus !== 'ready') {
          pendingItems.push({
            orderId: order._id,
            orderNumber: order.orderNumber,
            table: order.tableId,
            supervisor: order.supervisorId,
            item: {
              id: item._id,
              name: item.name,
              quantity: item.quantity,
              note: item.note,
              status: item.kitchenStatus,
              sentAt: item.sentToKitchenAt
            }
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      count: pendingItems.length,
      data: pendingItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending items',
      error: error.message
    });
  }
};

module.exports = {
  sendToKitchen,
  getKitchenStatus,
  getPendingItems
};
